/**
 * Whether an unanswered order can be edited under pre-authorization.
 * Prefer API `can_edit_order`; fall back to pay_type + use_preauthorization
 * (BOG v2 type 6, Acba type 18).
 */
export function canEditOrder(item) {
  if (!item) {
    return false;
  }

  if (item.can_edit_order !== undefined && item.can_edit_order !== null) {
    return Number(item.can_edit_order) === 1 || item.can_edit_order === true;
  }

  return (
    [6, 18].includes(Number(item.pay_type)) &&
    Number(item.use_preauthorization) === 1
  );
}
