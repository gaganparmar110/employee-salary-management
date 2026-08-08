// Tests never load backend/.env — this gives JWT signing/verification a
// secret to use without requiring real env setup just to run the suite.
process.env.JWT_SECRET ??= "test-secret";
