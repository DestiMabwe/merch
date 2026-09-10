"""add recipient_name to order_line_items

Revision ID: f526ad90be64
Revises: d0d642dcdf55
Create Date: 2026-09-10 10:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f526ad90be64'
down_revision: Union[str, Sequence[str], None] = 'd0d642dcdf55'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('order_line_items', sa.Column('recipient_name', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('order_line_items', 'recipient_name')
