'use client';

export default function DiscrepancyAlert(props: {
  matchStatus: string;
  priceVariance?: string | number | null;
  quantityVariance?: string | number | null;
  notes?: string | null;
}) {
  const isOk = props.matchStatus === 'MATCHED';
  const color = isOk ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800';

  return (
    <div className={`border rounded-lg p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Match Status: {props.matchStatus}</h4>
      </div>
      <div className="mt-2 text-sm">
        <div>Price Variance: {Number(props.priceVariance || 0).toFixed(2)}</div>
        <div>Quantity Variance: {Number(props.quantityVariance || 0).toFixed(2)}</div>
        {props.notes ? <div className="mt-2">{props.notes}</div> : null}
      </div>
    </div>
  );
}
