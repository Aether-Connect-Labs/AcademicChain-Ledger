module.exports = function planGate(requiredPlan) {
  const order = ['free', 'startup', 'enterprise'];
  return (req, res, next) => {
    const consumer = req.apiConsumer || {};
    const plan = consumer.plan || 'free';
    const allowed =
      requiredPlan === 'free' ? true :
      requiredPlan === 'startup' ? (plan === 'startup' || plan === 'enterprise') :
      requiredPlan === 'enterprise' ? (plan === 'enterprise') :
      false;
    if (!allowed) {
      res.status(403).json({ success: false, message: 'Plan required', data: { required: requiredPlan, current: plan } });
      return;
    }
    next();
  };
}
