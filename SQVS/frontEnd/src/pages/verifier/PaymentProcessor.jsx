import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { CheckCircle, CreditCard, Download, ChevronRight, ShieldCheck } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const PaymentProcessor = () => {
  const navigate = useNavigate()
  const { id: requestId } = useParams()
  const location = useLocation()
  const { amount = 0, reqId, qualsCount = 0 } = location.state || {}
  const [status, setStatus] = useState('processing')
  const [errorMsg, setErrorMsg] = useState('')
  const [txnDetails, setTxnDetails] = useState({
    transactionId: '',
    totalAmount: amount
  })

  useEffect(() => {
    const processPayment = async () => {
      try {
        const { data } = await api.put(`/verifier/payment/${requestId}`, {
          paymentMethod: 'UPI'
        })
        setTxnDetails({
          transactionId: data.transactionId,
          totalAmount: data.amount || amount
        })
        setStatus('success')
      } catch (error) {
        console.error('Payment processing error:', error)
        const msg = error.response?.data?.message || 'Payment processing failed'
        if (msg.includes('consent')) {
          setStatus('waiting_consent')
        } else {
          setErrorMsg(msg)
          setStatus('failed')
        }
      }
    }

    // Simulate a brief processing delay for UX
    const timer = setTimeout(processPayment, 1500)
    return () => clearTimeout(timer)
  }, [requestId, amount])

  if (status === 'processing') {
    return (
      <div className='min-h-[60vh] flex flex-col items-center justify-center'>
        <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6'></div>
        <h2 className='text-xl font-bold text-gray-800'>Processing Payment...</h2>
        <p className='text-sm text-gray-500 mt-1'>Please do not close or refresh this window.</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className='max-w-lg mx-auto mt-8'>
        <div className='bg-white rounded-xl border-2 border-red-400 p-8 text-center'>
          <p className='text-4xl mb-3'>❌</p>
          <h1 className='text-2xl font-bold text-red-600'>Payment Failed</h1>
          <p className='text-sm text-gray-500 mt-2'>{errorMsg || 'Something went wrong while processing your payment. Please try again.'}</p>
          <button onClick={() => navigate('/verifier/dashboard')} className='mt-6 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer'>
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (status === 'waiting_consent') {
    return (
      <div className='max-w-lg mx-auto mt-8'>
        <div className='bg-white rounded-xl border-2 border-amber-400 p-8 text-center'>
          <p className='text-4xl mb-3'>⏳</p>
          <h1 className='text-2xl font-bold text-amber-600'>Waiting for Consent</h1>
          <p className='text-sm text-gray-500 mt-2'>You cannot complete the payment until the student grants consent for all requested qualifications.</p>
          <div className='mt-6 flex flex-col gap-3'>
            <button onClick={() => navigate(`/verifier/requests/${requestId}`)} className='px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer'>
              View Request Status
            </button>
            <button onClick={() => navigate('/verifier/dashboard')} className='text-sm text-gray-500 hover:text-gray-700 transition'>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })

  return (
    <div className='max-w-lg mx-auto mt-8'>
      <div className='bg-white rounded-xl border-2 border-green-500 overflow-hidden'>
        {/* Success Header */}
        <div className='bg-green-50 p-8 text-center border-b border-green-200'>
          <div className='w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm'>
            <CheckCircle size={40} className='text-green-600' />
          </div>
          <h1 className='text-2xl font-bold text-green-700'>Payment Successful</h1>
          <p className='text-sm text-green-600 mt-1'>Your transaction of <strong>₹{txnDetails.totalAmount}</strong> was completed.</p>
        </div>

        {/* Details */}
        <div className='p-6 space-y-4'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500'>Transaction ID</span>
            <span className='font-mono font-semibold'>{txnDetails.transactionId}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500'>Date & Time</span>
            <span className='font-semibold'>{dateStr} • {timeStr}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500'>Request ID</span>
            <span className='font-semibold'>REQ-{requestId}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-500'>Qualifications</span>
            <span className='font-semibold'>{qualsCount} Verification(s)</span>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mt-4'>
            <strong>What's next?</strong> If the student has already granted consent, your verification is being processed. Otherwise, we are awaiting student approval to provide the verified documents.
          </div>

          <div className='flex gap-3 mt-6'>
            <button onClick={() => navigate('/verifier/dashboard')} className='flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 cursor-pointer'>
              Return to Dashboard <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentProcessor
