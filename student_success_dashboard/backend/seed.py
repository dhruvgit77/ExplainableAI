import os

import pandas as pd
from sqlalchemy.orm import Session

from .auth import hash_password
from .db_models import StudentProfile, User

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "student_data.csv")

TEACHER_USERNAME = "teacher1"
TEACHER_PASSWORD = "teacher123"
STUDENT_PASSWORD = "student123"
NUM_STUDENTS = 30

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
    "Ishaan", "Rohan", "Ananya", "Diya", "Saanvi", "Aadhya", "Kiara", "Myra",
    "Anika", "Riya", "Pari", "Ira", "Aryan", "Dev", "Kabir", "Yash", "Karan",
    "Meera", "Sneha", "Tanvi", "Priya", "Neha",
]


def seed_initial_data(db: Session):
    if db.query(User).first() is not None:
        return  # already seeded

    teacher = User(
        username=TEACHER_USERNAME,
        password_hash=hash_password(TEACHER_PASSWORD),
        role="teacher",
        full_name="Mrs. Iyer",
    )
    db.add(teacher)
    db.flush()  # get teacher.id

    df = pd.read_csv(DATA_PATH).head(NUM_STUDENTS).reset_index(drop=True)

    for i in range(NUM_STUDENTS):
        row = df.iloc[i]
        username = f"student{i + 1:02d}"
        name = f"{FIRST_NAMES[i % len(FIRST_NAMES)]} {chr(65 + i % 26)}."

        student = User(
            username=username,
            password_hash=hash_password(STUDENT_PASSWORD),
            role="student",
            full_name=name,
            teacher_id=teacher.id,
        )
        db.add(student)
        db.flush()  # get student.id

        profile_kwargs = {f: row[f] for f in StudentProfile.PROFILE_FIELDS}
        # normalize numpy scalar types to plain python types
        for k, v in profile_kwargs.items():
            if hasattr(v, "item"):
                profile_kwargs[k] = v.item()

        profile = StudentProfile(student_user_id=student.id, **profile_kwargs)
        db.add(profile)

    db.commit()
