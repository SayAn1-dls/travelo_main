from typing import Optional, List, Annotated, Any
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from datetime import datetime, timezone

PyObjectId = Annotated[str, BeforeValidator(str)]


def utcnow():
    return datetime.now(timezone.utc).isoformat()


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    def to_mongo(self) -> dict:
        d = self.model_dump(by_alias=True, exclude_none=True)
        d.pop("_id", None)
        return d

    @classmethod
    def from_mongo(cls, doc: Optional[dict]):
        if not doc:
            return None
        return cls.model_validate(doc)


class UserPublic(BaseDocument):
    email: str
    name: str
    phone: Optional[str] = None
    upi_vpa: Optional[str] = None
    currency: str = "INR"
    avatar: Optional[str] = None
    role: str = "user"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    upi_vpa: Optional[str] = None
    currency: Optional[str] = None


class SearchRequest(BaseModel):
    type: str  # flight | train | hotel
    origin: Optional[str] = None
    destination: str
    date: str
    return_date: Optional[str] = None
    passengers: int = Field(1, ge=1, le=9)
    travel_class: str = "economy"
    rooms: int = Field(1, ge=1, le=5)
    nights: int = Field(1, ge=1, le=30)


class Passenger(BaseModel):
    name: str
    age: int = Field(ge=1, le=110)
    gender: str = "other"


class BookingCreate(BaseModel):
    type: str
    item: dict
    passengers: List[Passenger]
    contact_email: str
    contact_phone: Optional[str] = None
    origin: Optional[str] = None
    destination: str
    travel_date: str
    nights: int = 1
    rooms: int = 1


class TripMemberIn(BaseModel):
    name: str
    email: str


class TripCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    destination: str
    start_date: str
    end_date: str
    budget_total: float = Field(ge=0)
    budget_categories: dict = {}
    members: List[TripMemberIn] = []


class ContributionUpdate(BaseModel):
    contribution: float = Field(ge=0)


class SplitIn(BaseModel):
    member_id: str
    amount: Optional[float] = None
    percent: Optional[float] = None


class ExpenseCreate(BaseModel):
    description: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    category: str = "other"
    paid_by: str
    split_type: str = "equal"  # equal | custom | percentage
    splits: List[SplitIn] = []


class SettlementCreate(BaseModel):
    from_member_id: str
    to_member_id: str
    amount: float = Field(gt=0)
    method: str = "upi"
    note: Optional[str] = None


class RemindRequest(BaseModel):
    from_member_id: str
    to_member_id: str
    amount: float = Field(gt=0)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = "general"
    lat: Optional[float] = None
    lng: Optional[float] = None
    city: Optional[str] = None
    destination: Optional[str] = None
    trip_id: Optional[str] = None


class CheckoutRequest(BaseModel):
    purpose: str  # booking | settlement
    origin_url: str
    booking_id: Optional[str] = None
    trip_id: Optional[str] = None
    from_member_id: Optional[str] = None
    to_member_id: Optional[str] = None
