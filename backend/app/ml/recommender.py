"""
ML-based recommender module for GB Tourism.

Option A — Content-Based Filtering: TF-IDF + cosine similarity (scikit-learn)
Option B — Collaborative Filtering:  SVD matrix factorisation (scikit-surprise)

get_ml_recommendations() is the public entry point.  It tries collaborative
first, then content-based, and returns ([], "rule_based") when neither has
enough data so the router can fall back to rule-based scoring unchanged.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.listing import Listing
from app.models.recently_viewed import RecentlyViewed


# ---------------------------------------------------------------------------
# Option A — Content-Based Filtering
# ---------------------------------------------------------------------------

def get_content_based_recommendations(
    user_id: int,
    db: Session,
    top_n: int = 10,
) -> list[int]:
    """
    Returns up to *top_n* listing_ids ordered by TF-IDF cosine similarity to
    the listings the user has booked or recently viewed (seed set).

    Returns an empty list when:
    - There are no listings in the DB.
    - The user has no seed listings (no bookings, no views).
    """
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    # 1. Query all listings.
    listings = db.query(Listing).all()
    if not listings:
        return []

    all_ids: list[int] = [lst.id for lst in listings]
    id_to_idx: dict[int, int] = {lst.id: i for i, lst in enumerate(listings)}

    # 2. Build a text corpus — one string per listing combining all text fields.
    corpus: list[str] = []
    for lst in listings:
        parts = [
            lst.title or "",
            lst.description or "",
            lst.service_type or "",
            lst.location or "",
            lst.amenities or "",
        ]
        corpus.append(" ".join(p for p in parts if p))

    # 3. Fit TF-IDF matrix.
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # 4. Gather seed listing_ids for this user.
    booked_ids: set[int] = set(
        row.listing_id
        for row in (
            db.query(Booking.listing_id)
            .filter(Booking.user_id == user_id, Booking.status != "cancelled")
            .all()
        )
    )
    viewed_ids: set[int] = set(
        row.listing_id
        for row in (
            db.query(RecentlyViewed.listing_id)
            .filter(RecentlyViewed.user_id == user_id)
            .all()
        )
    )
    seed_ids: set[int] = booked_ids | viewed_ids

    # 5. No seeds → cannot personalise.
    if not seed_ids:
        return []

    # 6. Locate seed rows inside the TF-IDF matrix.
    seed_indices = [id_to_idx[sid] for sid in seed_ids if sid in id_to_idx]
    if not seed_indices:
        return []

    # 7. Average cosine similarity from every seed to every listing.
    seed_vectors = tfidf_matrix[seed_indices]
    sim_matrix = cosine_similarity(seed_vectors, tfidf_matrix)  # (n_seeds, n_listings)
    avg_scores: np.ndarray = np.mean(sim_matrix, axis=0)        # (n_listings,)

    # 8. Rank — exclude already-booked listings and the seeds themselves.
    exclude_ids: set[int] = booked_ids | seed_ids
    ranked = sorted(
        [
            (all_ids[i], float(avg_scores[i]))
            for i in range(len(all_ids))
            if all_ids[i] not in exclude_ids
        ],
        key=lambda x: x[1],
        reverse=True,
    )

    # 9. Return top-n ids only.
    return [lid for lid, _ in ranked[:top_n]]


# ---------------------------------------------------------------------------
# Option B — Collaborative Filtering (SVD)
# ---------------------------------------------------------------------------

def get_collaborative_recommendations(
    user_id: int,
    db: Session,
    top_n: int = 10,
) -> list[int]:
    """
    Builds an implicit-feedback user–item matrix from bookings (weight 3.0)
    and recently-viewed events (weight 1.0), then trains an SVD model via
    scikit-surprise and returns predicted top-n listing_ids for the user.

    Returns an empty list when there is not yet enough interaction data
    (< 3 unique users, < 5 unique listings, or < 10 total interactions).
    """
    try:
        import pandas as pd
        from surprise import Dataset, Reader, SVD

        # 1. Accumulate (user_id, listing_id) → weight interactions.
        interactions: dict[tuple[int, int], float] = {}

        for uid, lid in (
            db.query(Booking.user_id, Booking.listing_id)
            .filter(Booking.status != "cancelled")
            .all()
        ):
            key = (uid, lid)
            interactions[key] = interactions.get(key, 0.0) + 3.0

        for uid, lid in db.query(RecentlyViewed.user_id, RecentlyViewed.listing_id).all():
            key = (uid, lid)
            interactions[key] = interactions.get(key, 0.0) + 1.0

        # Cap combined weight at 5.0.
        interactions = {k: min(v, 5.0) for k, v in interactions.items()}

        # 2. Check minimum thresholds before training.
        unique_users = len({uid for uid, _ in interactions})
        unique_listings = len({lid for _, lid in interactions})
        total_interactions = len(interactions)

        if unique_users < 3 or unique_listings < 5 or total_interactions < 10:
            return []

        # 3. Build a surprise Dataset from a DataFrame.
        df = pd.DataFrame(
            [(uid, lid, w) for (uid, lid), w in interactions.items()],
            columns=["user_id", "listing_id", "weight"],
        )
        reader = Reader(rating_scale=(0, 5))
        data = Dataset.load_from_df(df[["user_id", "listing_id", "weight"]], reader)

        # 4. Train SVD on the full dataset (no held-out split needed for serving).
        algo = SVD(n_factors=50, n_epochs=20, random_state=42)
        trainset = data.build_full_trainset()
        algo.fit(trainset)

        # 5. Identify listings this user has NOT yet interacted with.
        seen: set[int] = {lid for (uid, lid) in interactions if uid == user_id}
        all_listing_ids: list[int] = [row[0] for row in db.query(Listing.id).all()]
        unseen = [lid for lid in all_listing_ids if lid not in seen]

        if not unseen:
            return []

        # 6–7. Predict scores and rank.
        preds = [(lid, algo.predict(user_id, lid).est) for lid in unseen]
        preds.sort(key=lambda x: x[1], reverse=True)

        return [lid for lid, _ in preds[:top_n]]
    except ImportError:
        return []


# ---------------------------------------------------------------------------
# Public entry point — cascade fallback wrapper
# ---------------------------------------------------------------------------

def get_ml_recommendations(
    user_id: int,
    db: Session,
    top_n: int = 10,
) -> tuple[list[int], str]:
    """
    Tries collaborative filtering first, then content-based filtering.
    Returns a tuple of (listing_ids, source_label).

    source_label is one of: "collaborative", "content_based", "rule_based".
    "rule_based" means both ML engines failed or had insufficient data —
    the caller should fall back to its own rule-based scoring.
    """
    try:
        collab = get_collaborative_recommendations(user_id, db, top_n)
        if len(collab) >= 3:
            return collab, "collaborative"
    except Exception as exc:
        print(f"[recommender] Collaborative filtering failed: {exc}")

    try:
        content = get_content_based_recommendations(user_id, db, top_n)
        if len(content) >= 3:
            return content, "content_based"
    except Exception as exc:
        print(f"[recommender] Content-based filtering failed: {exc}")

    return [], "rule_based"
