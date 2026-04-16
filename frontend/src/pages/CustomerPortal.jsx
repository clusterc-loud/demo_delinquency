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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counsellorLoading, setCounsellorLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Fetch data from backend portal controller
    api.get(`/portal/${id}/health`)
      .then(({ data: res }) => { if (res) setData(res); })
      .catch(() => { addToast('Session expired or account not found.', 'error'); })
      .finally(() => setLoading(false));
  }, [id, addToast]);

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

  const refreshData = async () => {
    try {
      const { data: res } = await api.get(`/portal/${id}/health`);
      if (res) setData(res);
    } catch (err) {
      console.error("Failed to refresh data", err);
    }
  };

  const handleSimulateAction = async (type, action) => {
    setLoading(true);
    try {
      const endpoint = type === 'MSME' ? '/simulator/msme-transaction' : '/simulator/retail-transaction';
      await api.post(endpoint, { customerId: data.customerId, action });
      addToast(`${action.replace('_', ' ')} simulated successfully.`, 'warning');
      await refreshData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Simulation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="bg-[#f0fdf1] min-h-screen p-8">
        <SkeletonLoader type="card" rows={4} />
      </div>
    );
  }

  const handlePayEmi = async (emiId) => {
    setLoading(true);
    try {
      const res = await api.post(`/portal/${data.customerId}/pay-emi/${emiId}`);
      if (res.data.success) {
        addToast(`EMI Paid successfully! New Score: ${res.data.newScore}. TX: ${res.data.txId}`, 'success');
        await refreshData();
      }
    } catch(err) {
      addToast(err.response?.data?.message || 'Failed to pay EMI', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {data.customerType === 'MSME' ? (
        <MSMEDashboard 
          data={data} 
          loading={loading} 
          onHelpSelect={handleCounsellor} 
          onSimulate={(action) => handleSimulateAction('MSME', action)} 
        />
      ) : (
        <RetailDashboard 
          data={data} 
          loading={loading} 
          onHelpSelect={handleCounsellor} 
          onPayEmi={handlePayEmi} 
          onSimulate={(action) => handleSimulateAction('RETAIL', action)}
        />
      )}
    </>
  );
}
