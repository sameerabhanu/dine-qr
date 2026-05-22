'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DeleteRestaurantButton({ 
  restaurantId, 
  restaurantName 
}: { 
  restaurantId: string;
  restaurantName: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowConfirm(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(`Failed to delete restaurant: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      alert('An error occurred while deleting the restaurant');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-gray-900 hover:text-red-600 transition"
        title="Delete restaurant"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Restaurant"
        message={`Are you sure you want to delete "${restaurantName}"?\n\nThis will permanently delete:\n• All orders and order history\n• Menu items and categories\n• Staff accounts and waiters\n• Tables and QR codes\n• Subscription data\n\nThis action cannot be undone.`}
        confirmText="Delete Restaurant"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        loading={isDeleting}
      />
    </>
  );
}
