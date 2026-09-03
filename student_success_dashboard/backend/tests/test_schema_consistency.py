"""
StudentProfile (Pydantic, routers/predict.py) and StudentProfile (SQLAlchemy,
db_models.py) are maintained by hand as two separate field lists describing
the same student profile. This test catches drift between them early instead
of letting it surface as a confusing runtime error.
"""
from backend.routers.predict import StudentProfile as Schema
from backend.db_models import StudentProfile as DBModel


def test_pydantic_schema_matches_db_model_fields():
    schema_fields = set(Schema.model_fields.keys())
    db_fields = set(DBModel.PROFILE_FIELDS)
    assert schema_fields == db_fields, (
        f"Schema-only: {schema_fields - db_fields}, DB-only: {db_fields - schema_fields}"
    )


def test_default_profile_covers_every_schema_field():
    from backend.routers.auth import DEFAULT_PROFILE

    assert set(DEFAULT_PROFILE.keys()) == set(Schema.model_fields.keys())
