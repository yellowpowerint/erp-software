'use client';

export default function PaymentSchedule(props: {
  dueDate: string;
  paymentStatus: string;
  currency: string;
  totalAmount: string | number;
  paidAmount: string | number;
}) {
  const due = new Date(props.dueDate);
  const total = Number(props.totalAmount || 0);
  const paid = Number(props.paidAmount || 0);
  const remaining = Math.max(0, total - paid);

  const badge = (status: string) => {
    const colors: any = {
      UNPAID: 'bg-gray-100 text-gray-800',
      PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
          <p className="text-sm text-gray-600 mt-1">Due: {due.toLocaleDateString()}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge(props.paymentStatus)}`}>
          {props.paymentStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-sm font-semibold text-gray-900">
            {props.currency} {total.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Paid</div>
          <div className="text-sm font-semibold text-gray-900">
            {props.currency} {paid.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Remaining</div>
          <div className="text-sm font-semibold text-gray-900">
            {props.currency} {remaining.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
