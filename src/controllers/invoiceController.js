const Invoice = require('../models/Invoice');

// @desc    Get all invoices (paginated + search)
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { invoiceId: { $regex: req.query.keyword, $options: 'i' } },
          { referenceNumber: { $regex: req.query.keyword, $options: 'i' } },
          { status: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const query = { user: req.user._id, ...keyword };

  const count = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .populate('items.product', 'name productId')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ invoices, page, pages: Math.ceil(count / pageSize), total: count });
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
    .populate('items.product', 'name productId category image');

  if (invoice) {
    res.json(invoice);
  } else {
    res.status(404).json({ message: 'Invoice not found' });
  }
};

// @desc    Update invoice status (Paid/Unpaid)
// @route   PUT /api/invoices/:id/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });

  if (invoice) {
    invoice.status = req.body.status || invoice.status;
    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } else {
    res.status(404).json({ message: 'Invoice not found' });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });

  if (invoice) {
    await invoice.deleteOne();
    res.json({ message: 'Invoice removed' });
  } else {
    res.status(404).json({ message: 'Invoice not found' });
  }
};

// @desc    Get Invoice Dashboard Stats
// @route   GET /api/invoices/stats
// @access  Private
const getInvoiceStats = async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const totalInvoicesLast7Days = await Invoice.countDocuments({
    user: req.user._id,
    createdAt: { $gte: sevenDaysAgo }
  });

  const totalPaidInvoices = await Invoice.countDocuments({
    user: req.user._id,
    status: 'Paid'
  });

  const paidStats = await Invoice.aggregate([
    { $match: { user: req.user._id, status: 'Paid' } },
    { $group: { _id: null, totalAmount: { $sum: '$amount' }, customerCount: { $addToSet: '$user' } } }
  ]);

  const unpaidStats = await Invoice.aggregate([
    { $match: { user: req.user._id, status: 'Unpaid' } },
    { $group: { _id: null, totalAmount: { $sum: '$amount' }, customerCount: { $addToSet: '$user' } } }
  ]);

  const recentInvoices = await Invoice.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    recentTransactions: recentInvoices,
    totalInvoicesLast7Days,
    totalInvoicesPaid: totalPaidInvoices,
    paidAmount: paidStats[0] ? paidStats[0].totalAmount : 0,
    paidCustomerCount: paidStats[0] ? paidStats[0].customerCount.length : 0,
    unpaidAmount: unpaidStats[0] ? unpaidStats[0].totalAmount : 0,
    unpaidCustomerCount: unpaidStats[0] ? unpaidStats[0].customerCount.length : 0,
  });
};

module.exports = {
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoiceStats,
};
