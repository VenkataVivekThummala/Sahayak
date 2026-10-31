"""SQLAlchemy models for Government Sahayak."""
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, ForeignKey, DateTime, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base

class SchemeCategory(Base):
    __tablename__ = "scheme_categories"
    id = Column(String(50), primary_key=True)
    name_en = Column(String(100), nullable=False)
    name_te = Column(String(100), nullable=False)
    schemes = relationship("Scheme", back_populates="category_rel", cascade="all, delete-orphan")

class Scheme(Base):
    __tablename__ = "schemes"
    scheme_id = Column(String(50), primary_key=True, index=True)
    category_id = Column(String(50), ForeignKey("scheme_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name_en = Column(String(255), nullable=False)
    name_te = Column(String(255), nullable=False)
    scope = Column(String(50), nullable=False)  # central or andhra_pradesh
    department = Column(String(255), nullable=False)
    summary_en = Column(Text, nullable=False)
    summary_te = Column(Text, nullable=False)
    last_verified = Column(String(20), nullable=False)

    category_rel = relationship("SchemeCategory", back_populates="schemes")
    benefits = relationship("SchemeBenefit", back_populates="scheme", cascade="all, delete-orphan")
    eligibility_rules = relationship("EligibilityRule", back_populates="scheme", cascade="all, delete-orphan")
    documents = relationship("RequiredDocument", back_populates="scheme", cascade="all, delete-orphan")
    steps = relationship("ApplicationStep", back_populates="scheme", cascade="all, delete-orphan")
    sources = relationship("GovernmentSource", back_populates="scheme", cascade="all, delete-orphan")
    discrepancies = relationship("KnownDiscrepancy", back_populates="scheme", cascade="all, delete-orphan")

class SchemeBenefit(Base):
    __tablename__ = "scheme_benefits"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id = Column(String(50), ForeignKey("schemes.scheme_id", ondelete="CASCADE"), nullable=False, index=True)
    benefit_order = Column(Integer, nullable=False)
    benefit_en = Column(Text, nullable=False)
    benefit_te = Column(Text, nullable=False)

    scheme = relationship("Scheme", back_populates="benefits")

class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id = Column(String(50), ForeignKey("schemes.scheme_id", ondelete="CASCADE"), nullable=False, index=True)
    path_index = Column(Integer, nullable=False, default=0)
    rule_order = Column(Integer, nullable=False, default=0)
    field = Column(String(50), nullable=False)
    op = Column(String(10), nullable=False)
    value_str = Column(String(100), nullable=False)
    kind = Column(String(20), nullable=False)
    en = Column(Text, nullable=False)
    te = Column(Text, nullable=False)

    __table_args__ = (
        CheckConstraint("op IN ('is', 'gte', 'lte', 'gt', 'lt')", name="ck_eligibility_rules_op"),
        CheckConstraint("kind IN ('hard', 'list', 'advisory')", name="ck_eligibility_rules_kind"),
    )

    scheme = relationship("Scheme", back_populates="eligibility_rules")

class RequiredDocument(Base):
    __tablename__ = "required_documents"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id = Column(String(50), ForeignKey("schemes.scheme_id", ondelete="CASCADE"), nullable=False, index=True)
    name_en = Column(String(255), nullable=False)
    name_te = Column(String(255), nullable=False)
    required = Column(Boolean, nullable=True)  # True, False, or None (confirm at office)

    scheme = relationship("Scheme", back_populates="documents")

class ApplicationStep(Base):
    __tablename__ = "application_steps"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id = Column(String(50), ForeignKey("schemes.scheme_id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    step_en = Column(Text, nullable=False)
    step_te = Column(Text, nullable=False)

    scheme = relationship("Scheme", back_populates="steps")

class GovernmentSource(Base):
    __tablename__ = "government_sources"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id = Column(String(50), ForeignKey("schemes.scheme_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    source_type = Column(String(30), nullable=False)

    __table_args__ = (
        CheckConstraint("source_type IN ('official', 'government-portal', 'secondary')", name="ck_sources_type"),
    )

    scheme = relationship("Scheme", back_populates="sources")

class KnownDiscrepancy(Base):
    __tablename__ = "known_discrepancies"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scheme_id = Column(String(50), ForeignKey("schemes.scheme_id", ondelete="CASCADE"), nullable=False, index=True)
    discrepancy_text = Column(Text, nullable=False)

    scheme = relationship("Scheme", back_populates="discrepancies")

class HelpRequest(Base):
    __tablename__ = "help_requests"
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(64), unique=True, nullable=False, index=True)
    scheme_id = Column(String(50), nullable=True, index=True)
    question = Column(Text, nullable=False)
    language = Column(String(10), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    consent = Column(Boolean, nullable=False, default=True)
    status = Column(String(20), nullable=False, default="open")  # open, assigned, closed
    status_token = Column(String(64), nullable=False, index=True)
    response = Column(Text, nullable=True)
    assigned_to = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("language IN ('en', 'te')", name="ck_help_language"),
        CheckConstraint("status IN ('open', 'assigned', 'closed')", name="ck_help_status"),
    )

class StaffUser(Base):
    __tablename__ = "staff_users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="agent")  # agent, admin
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'agent')", name="ck_staff_role"),
    )

class DeviceToken(Base):
    __tablename__ = "device_tokens"
    id = Column(Integer, primary_key=True, autoincrement=True)
    fcm_token = Column(String(255), unique=True, nullable=False, index=True)
    language = Column(String(10), nullable=False, default="te")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class CitizenUser(Base):
    __tablename__ = "citizen_users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    pin_hash = Column(String(255), nullable=False)
    preferred_language = Column(String(10), nullable=False, default="te")
    district = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login_at = Column(DateTime, nullable=True)
