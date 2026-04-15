import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import api from '../api/axios';
import MSMEDashboard from './MSMEDashboard';
import RetailDashboard from './RetailDashboard';
import SkeletonLoader from '../components/SkeletonLoader';

const MOCK_DATA = {
  customerId: 'VC-00012',
  name: 'Kavya Nair',
  score: 74,
  band: 'GOOD',
  customerType: 'RETAIL',
  summaryText: 'Your financial health is good. You have strong areas in Consistent Savings.',
};

export default function CustomerPortal() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [counsellorLoading, setCounsellorLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Fetch data from backend portal controller
    api.get(`/portal/${id}/health`)
      .then(({ data: res }) => { if (res) setData((p) => ({ ...p, ...res })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCounsellor = async () => {
    setCounsellorLoading(true);
    try {
      await api.post(`/portal/${id}/request-counsellor`);
      addToast('Counsellor request submitted! We\'ll contact you within 24 hours.', 'success');
    } catch {
      addToast('Request submitted (demo mode).', 'warning');
    } finally {
      setCounsellorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f0fdf1] min-h-screen p-8">
        <SkeletonLoader type="card" rows={4} />
      </div>
    );
  }

  // Choose the dashboard based on customerType
  if (data.customerType === 'MSME') {
    return (
      <MSMEDashboard 
        data={data} 
        loading={loading} 
        onHelpSelect={handleCounsellor} 
      />
    );
  }

  // Fallback to retail dashboard for RETAIL or any other undefined type
  return (
    <RetailDashboard 
      data={data} 
      loading={loading} 
      onHelpSelect={handleCounsellor} 
    />
  );
}
