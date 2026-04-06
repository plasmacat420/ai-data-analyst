def test_upload_csv(client, sales_csv_path):
    with open(sales_csv_path, "rb") as f:
        response = client.post("/api/datasets/upload", files={"file": ("sales.csv", f, "text/csv")})
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "sales.csv"
    assert data["rows"] == 500
    assert "date" in data["columns"]
    assert "revenue" in data["columns"]
    assert "product" in data["columns"]
    assert len(data["preview"]) == 5


def test_load_sample_sales(client):
    response = client.post("/api/datasets/sample/sales")
    assert response.status_code == 200
    data = response.json()
    assert data["rows"] == 500
    assert "date" in data["columns"]
    assert "revenue" in data["columns"]


def test_load_sample_employees(client):
    response = client.post("/api/datasets/sample/employees")
    assert response.status_code == 200
    data = response.json()
    assert data["rows"] == 100
    assert "department" in data["columns"]
    assert "salary" in data["columns"]


def test_load_sample_ecommerce(client):
    response = client.post("/api/datasets/sample/ecommerce")
    assert response.status_code == 200
    data = response.json()
    assert data["rows"] == 300
    assert "order_id" in data["columns"]
    assert "amount" in data["columns"]


def test_load_unknown_sample_returns_404(client):
    response = client.post("/api/datasets/sample/doesnotexist")
    assert response.status_code == 404


def test_list_datasets(client):
    client.post("/api/datasets/sample/sales")
    client.post("/api/datasets/sample/employees")
    response = client.get("/api/datasets")
    assert response.status_code == 200
    data = response.json()
    # Each sample loaded once (idempotent by filename)
    names = {d["filename"] for d in data}
    assert "sales.csv" in names
    assert "employees.csv" in names


def test_delete_dataset(client):
    res = client.post("/api/datasets/sample/sales")
    dataset_id = res.json()["id"]
    del_res = client.delete(f"/api/datasets/{dataset_id}")
    assert del_res.status_code == 200
    list_res = client.get("/api/datasets")
    ids = [d["id"] for d in list_res.json()]
    assert dataset_id not in ids


def test_get_dataset(client):
    res = client.post("/api/datasets/sample/ecommerce")
    dataset_id = res.json()["id"]
    get_res = client.get(f"/api/datasets/{dataset_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == dataset_id


def test_get_nonexistent_dataset_returns_404(client):
    response = client.get("/api/datasets/nonexistent-id")
    assert response.status_code == 404
