"""Order lifecycle state machine.

Pure functions over the status string — no DB or HTTP dependency, so the
transition rules can be unit tested directly against this module.
"""


class InvalidTransitionError(Exception):
    def __init__(self, current_status: str, target_status: str):
        super().__init__(f"Cannot transition order from {current_status!r} to {target_status!r}")
        self.current_status = current_status
        self.target_status = target_status


_TRANSITIONS: dict[str, set[str]] = {
    "pending_payment": {"paid", "cancelled"},
    "paid": {"ready_for_collection", "cancelled"},
    "ready_for_collection": {"collected", "cancelled"},
    "collected": set(),
    "cancelled": set(),
}


def transition(current_status: str, target_status: str) -> str:
    if target_status not in _TRANSITIONS.get(current_status, set()):
        raise InvalidTransitionError(current_status, target_status)
    return target_status
