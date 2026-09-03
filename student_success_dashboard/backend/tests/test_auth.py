def test_signup_teacher_then_me(client):
    res = client.post("/api/auth/signup", json={
        "username": "newteacher", "password": "secretpw", "full_name": "Mrs. New",
        "role": "teacher", "teacher_id": None,
    })
    assert res.status_code == 201
    body = res.json()
    assert body["role"] == "teacher"
    assert "access_token" not in body  # token must travel via httpOnly cookie, not the JSON body

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "newteacher"


def test_signup_duplicate_username_rejected(client):
    payload = {"username": "dupe", "password": "pw", "full_name": "A", "role": "teacher", "teacher_id": None}
    assert client.post("/api/auth/signup", json=payload).status_code == 201
    assert client.post("/api/auth/signup", json=payload).status_code == 409


def test_student_signup_requires_valid_teacher(client):
    res = client.post("/api/auth/signup", json={
        "username": "stu1", "password": "pw", "full_name": "Stu", "role": "student", "teacher_id": 999,
    })
    assert res.status_code == 400


def test_login_wrong_password_rejected(client, teacher_and_student):
    res = client.post("/api/auth/login", json={"username": "t1", "password": "wrong"})
    assert res.status_code == 401


def test_me_requires_authentication(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_logout_clears_session(client, teacher_and_student):
    client.post("/api/auth/login", json={"username": "t1", "password": "pw12345"})
    assert client.get("/api/auth/me").status_code == 200

    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401
