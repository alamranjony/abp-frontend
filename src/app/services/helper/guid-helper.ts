export function isGuidNullOrEmpty(guid: string): boolean {
  const emptyGuid = '00000000-0000-0000-0000-000000000000';
  return !guid || guid === emptyGuid;
}
