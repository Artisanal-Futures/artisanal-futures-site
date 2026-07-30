/**
 * Shared visibility filters for public catalog reads.
 *
 * Three separate procedures list products and services to anonymous visitors
 * (product.getAllByCategory, service.getAllByCategory, and
 * category.getCategoriesWithFeaturedProducts). They have drifted apart before —
 * one honoured `isPublic` while another did not — so the rule lives here once.
 */

/**
 * Exclude items belonging to a shop that is itself hidden.
 *
 * A hidden shop's storefront 404s for the public (enforced in `shop.get`), so
 * listing its products in browse and search would contradict that.
 *
 * Written as an OR rather than the shorter `{ shop: { isPublic: true } }`
 * because `shopId` is nullable: the shorter form also drops items that have no
 * shop at all, which is a different question and not one this filter is meant
 * to answer. There are no shopless items today, but the column allows them.
 *
 * Because it carries an `OR` key, combine it as its own entry in an `AND`
 * array rather than spreading it into a where clause — a spread would be
 * silently overwritten by any sibling `OR` added later.
 */
export const fromVisibleShop = {
  OR: [{ shopId: null }, { shop: { isPublic: true } }],
};
