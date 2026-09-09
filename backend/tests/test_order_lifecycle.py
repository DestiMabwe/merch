import pytest

from app.order_lifecycle import InvalidTransitionError, transition


def test_pending_payment_transitions_to_paid():
    assert transition("pending_payment", "paid") == "paid"


def test_pending_payment_cannot_skip_straight_to_ready_for_collection():
    with pytest.raises(InvalidTransitionError):
        transition("pending_payment", "ready_for_collection")


def test_marking_an_already_paid_order_as_paid_again_is_rejected():
    with pytest.raises(InvalidTransitionError):
        transition("paid", "paid")


def test_paid_transitions_to_ready_for_collection():
    assert transition("paid", "ready_for_collection") == "ready_for_collection"


@pytest.mark.parametrize(
    "current_status", ["pending_payment", "ready_for_collection", "collected", "cancelled"]
)
def test_ready_for_collection_is_only_reachable_from_paid(current_status):
    with pytest.raises(InvalidTransitionError):
        transition(current_status, "ready_for_collection")


def test_ready_for_collection_transitions_to_collected():
    assert transition("ready_for_collection", "collected") == "collected"


@pytest.mark.parametrize(
    "current_status", ["pending_payment", "paid", "collected", "cancelled"]
)
def test_collected_is_only_reachable_from_ready_for_collection(current_status):
    with pytest.raises(InvalidTransitionError):
        transition(current_status, "collected")


@pytest.mark.parametrize("current_status", ["pending_payment", "paid", "ready_for_collection"])
def test_cancel_succeeds_from_each_active_state(current_status):
    assert transition(current_status, "cancelled") == "cancelled"


def test_a_collected_order_cannot_be_cancelled():
    with pytest.raises(InvalidTransitionError):
        transition("collected", "cancelled")


def test_cancelling_an_already_cancelled_order_is_rejected_not_a_silent_noop():
    with pytest.raises(InvalidTransitionError):
        transition("cancelled", "cancelled")
