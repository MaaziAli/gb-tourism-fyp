from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, field_validator


RuleType = Literal["length_of_stay", "last_minute", "advance_booking"]


class DiscountRuleCreate(BaseModel):
  listing_id: int | None = None  # populated from path on the server side
  rule_type: RuleType
  min_nights: Optional[int] = None
  max_nights: Optional[int] = None
  book_within_days: Optional[int] = None
  book_days_ahead: Optional[int] = None
  discount_percent: float
  label: str
  is_active: bool = True

  @field_validator("discount_percent")
  @classmethod
  def discount_in_range(cls, v: float) -> float:
      if v < 0 or v > 100:
          raise ValueError("discount_percent must be between 0 and 100")
      return v

  @field_validator("rule_type")
  @classmethod
  def rule_type_valid(cls, v: str) -> str:
      allowed = {"length_of_stay", "last_minute", "advance_booking"}
      if v not in allowed:
          raise ValueError(f"rule_type must be one of {', '.join(sorted(allowed))}")
      return v


class DiscountRuleUpdate(BaseModel):
  rule_type: Optional[RuleType] = None
  min_nights: Optional[int] = None
  max_nights: Optional[int] = None
  book_within_days: Optional[int] = None
  book_days_ahead: Optional[int] = None
  discount_percent: Optional[float] = None
  label: Optional[str] = None
  is_active: Optional[bool] = None

  @field_validator("discount_percent")
  @classmethod
  def discount_in_range(cls, v: Optional[float]) -> Optional[float]:
      if v is None:
          return v
      if v < 0 or v > 100:
          raise ValueError("discount_percent must be between 0 and 100")
      return v

  @field_validator("rule_type")
  @classmethod
  def rule_type_valid(cls, v: Optional[str]) -> Optional[str]:
      if v is None:
          return v
      allowed = {"length_of_stay", "last_minute", "advance_booking"}
      if v not in allowed:
          raise ValueError(f"rule_type must be one of {', '.join(sorted(allowed))}")
      return v


class DiscountRuleResponse(BaseModel):
  id: int
  listing_id: int
  rule_type: str
  min_nights: Optional[int] = None
  max_nights: Optional[int] = None
  book_within_days: Optional[int] = None
  book_days_ahead: Optional[int] = None
  discount_percent: float
  label: str
  is_active: bool

  model_config = {"from_attributes": True}

