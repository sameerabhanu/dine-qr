'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteRestaurantButton({ 
  restaurantId, 
  restaurantName 
}: { 
  restaurantId: string;
  restaurantName: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${restaurantName}"? This action cannot be undone and will delete all associated data (orders, menu items, staff, etc.).`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Restaurant deleted successfully!');
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
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-sm font-medium text-red-600 hover:text-red-700 transition inline-flex items-center gap-1 disabled:opacity-50"
      title="Delete restaurant"
    >
      <Trash2 className="w-4 h-4" />
      {isDeleting && <span className="text-xs">(Deleting...)</span>}
    </button>
  );
}
