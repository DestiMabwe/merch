"""API-level tests for the admin orders endpoints.

Each test drives the real routes through the TestClient (checkout as a
customer would, then act as admin) rather than poking the ORM directly, so a
refactor of the internals can't silently break these.
"""


def _place_order(client, variant_id, quantity=1, name="Grace Mabwe", email="g@example.com"):
    response = client.post(
        "/orders",
        json={
            "customer_name": name,
            "customer_email": email,
            "items": [{"variant_id": variant_id, "quantity": quantity}],
        },
    )
    assert response.status_code == 201, response.json()
    return response.json()


def _first_item_id(client, auth_headers, reference):
    return client.get(f"/admin/orders/{reference}", headers=auth_headers).json()["items"][0]["id"]


def test_admin_cannot_attach_proof_of_payment_to_a_cancelled_order(client, make_product, auth_headers):
    tee = make_product("Purpose Tee", variants=[{"stock": 5}])
    order = _place_order(client, tee.variants[0].id)
    reference = order["reference"]

    cancelled = client.post(f"/admin/orders/{reference}/cancel", headers=auth_headers)
    assert cancelled.status_code == 200

    response = client.post(
        f"/admin/orders/{reference}/proof",
        headers=auth_headers,
        files={"file": ("proof.png", b"\x89PNG fake", "image/png")},
    )

    assert response.status_code == 400
    assert "cancelled" in response.json()["detail"].lower()


def test_repointing_a_line_item_to_an_inactive_variant_is_rejected(client, make_product, auth_headers):
    tee = make_product("Purpose Tee", variants=[{"stock": 5}])
    hoodie = make_product("Purpose Hoodie", variants=[{"stock": 5, "active": False}])
    order = _place_order(client, tee.variants[0].id)
    reference = order["reference"]
    item_id = _first_item_id(client, auth_headers, reference)

    response = client.patch(
        f"/admin/orders/{reference}/items/{item_id}",
        headers=auth_headers,
        json={"variant_id": hoodie.variants[0].id},
    )

    assert response.status_code == 400


def test_repointing_a_line_item_to_a_variant_of_an_inactive_product_is_rejected(
    client, make_product, auth_headers
):
    tee = make_product("Purpose Tee", variants=[{"stock": 5}])
    retired = make_product("Retired Cap", active=False, variants=[{"stock": 5}])
    order = _place_order(client, tee.variants[0].id)
    reference = order["reference"]
    item_id = _first_item_id(client, auth_headers, reference)

    response = client.patch(
        f"/admin/orders/{reference}/items/{item_id}",
        headers=auth_headers,
        json={"variant_id": retired.variants[0].id},
    )

    assert response.status_code == 400


def test_increasing_quantity_beyond_current_stock_is_rejected(client, make_product, auth_headers):
    tee = make_product("Purpose Tee", variants=[{"stock": 5}])
    order = _place_order(client, tee.variants[0].id, quantity=1)
    reference = order["reference"]
    item_id = _first_item_id(client, auth_headers, reference)

    response = client.patch(
        f"/admin/orders/{reference}/items/{item_id}",
        headers=auth_headers,
        json={"quantity": 999},
    )

    assert response.status_code == 400


def test_a_valid_variant_reassignment_still_succeeds(client, make_product, auth_headers):
    tee = make_product("Purpose Tee", variants=[{"stock": 5}])
    hoodie = make_product("Purpose Hoodie", variants=[{"stock": 5, "price": 650}])
    order = _place_order(client, tee.variants[0].id)
    reference = order["reference"]
    item_id = _first_item_id(client, auth_headers, reference)

    response = client.patch(
        f"/admin/orders/{reference}/items/{item_id}",
        headers=auth_headers,
        json={"variant_id": hoodie.variants[0].id},
    )

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["product_name"] == "Purpose Hoodie"
    assert item["unit_price"] == 650


def test_decreasing_quantity_within_stock_still_succeeds(client, make_product, auth_headers):
    tee = make_product("Purpose Tee", variants=[{"stock": 5}])
    order = _place_order(client, tee.variants[0].id, quantity=3)
    reference = order["reference"]
    item_id = _first_item_id(client, auth_headers, reference)

    response = client.patch(
        f"/admin/orders/{reference}/items/{item_id}",
        headers=auth_headers,
        json={"quantity": 1},
    )

    assert response.status_code == 200
    assert response.json()["items"][0]["quantity"] == 1
