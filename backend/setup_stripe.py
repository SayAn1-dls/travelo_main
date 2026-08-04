"""Idempotent Stripe catalog setup for TRAVELO — one product per destination,
three tier prices each (lookup_key = '{destination_id}_{tier}').
Run standalone or via server startup thread.
"""
import os
import logging
from pathlib import Path

import stripe
from dotenv import load_dotenv

from destinations_data import DESTINATIONS, TIERS, tier_price

load_dotenv(Path(__file__).parent / ".env")

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"

logger = logging.getLogger("setup_stripe")

TRAVEL_TAX_CODE = "txcd_20030000"  # General - Services


def ensure_tax_settings():
    try:
        s = stripe.tax.Settings.retrieve()
        if s.head_office and getattr(s.head_office, "address", None):
            return
        stripe.tax.Settings.modify(
            head_office={"address": {"country": "US", "line1": "350 Fifth Avenue",
                                     "city": "New York", "state": "NY", "postal_code": "10118"}},
            defaults={"tax_behavior": "exclusive"},
        )
    except Exception as e:  # noqa: BLE001
        logger.warning("tax settings setup skipped: %s", e)


def get_or_create_product(dest):
    for p in stripe.Product.list(active=True, limit=100).auto_paging_iter():
        if p.to_dict().get("metadata", {}).get("emergent_product_id") == dest["id"]:
            return p
    kwargs = dict(
        name=f"TRAVELO — {dest['name']}, {dest['country']}",
        metadata={"managed_by": "emergent", "emergent_product_id": dest["id"]},
    )
    try:
        return stripe.Product.create(**kwargs, tax_code=TRAVEL_TAX_CODE)
    except stripe.error.InvalidRequestError:
        return stripe.Product.create(**kwargs)


def ensure_price(product, lookup_key, amount_cents):
    existing = stripe.Price.list(lookup_keys=[lookup_key], active=True, limit=1).data
    if existing and (existing[0].unit_amount != amount_cents or existing[0].currency != "usd"):
        stripe.Price.modify(existing[0].id, active=False)
        existing = []
    if not existing:
        stripe.Price.create(
            product=product.id,
            unit_amount=amount_cents,
            currency="usd",
            lookup_key=lookup_key,
            transfer_lookup_key=True,
        )


def run():
    ensure_tax_settings()
    # Cache product list once to avoid N list calls
    existing_products = {}
    for p in stripe.Product.list(active=True, limit=100).auto_paging_iter():
        epid = p.to_dict().get("metadata", {}).get("emergent_product_id")
        if epid:
            existing_products[epid] = p
    for dest in DESTINATIONS:
        product = existing_products.get(dest["id"])
        if not product:
            kwargs = dict(
                name=f"TRAVELO — {dest['name']}, {dest['country']}",
                metadata={"managed_by": "emergent", "emergent_product_id": dest["id"]},
            )
            try:
                product = stripe.Product.create(**kwargs, tax_code=TRAVEL_TAX_CODE)
            except stripe.error.InvalidRequestError:
                product = stripe.Product.create(**kwargs)
        for tier in TIERS:
            ensure_price(product, f"{dest['id']}_{tier}", tier_price(dest["base_price"], tier) * 100)
    logger.info("Stripe catalog ready: %d products x %d tiers", len(DESTINATIONS), len(TIERS))
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
    print("Stripe catalog setup complete.")
