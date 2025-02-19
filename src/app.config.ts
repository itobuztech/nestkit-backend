export const appConfig = {
  currentworkspaceid: 'currentworkspaceid',
  userPasswordValidationRegex:
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]+$/,
  uniqueConstraintsPrismaErrorCode: 'P2002',
  notFoundPrismaErrorCode: 'P2025',
  foreignKeyConstraintsPrismaErrorCode: 'P2003',
};
