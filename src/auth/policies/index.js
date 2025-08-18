export function isOwner(user, resource) {
  return user?.id && resource?.ownerId && user.id === resource.ownerId;
}

export function isVerified(user) {
  return !!user?.verificado;
}

export function planAtLeast(user, required) {
  const order = ["basico","pro","negocio","empresarial"];
  const idxUser = order.indexOf(user?.plan ?? "basico");
  const idxReq = order.indexOf(required);
  return idxUser >= idxReq;
}
