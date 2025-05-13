import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { auth, addMemberToGroup } from '../../lib/firebase';
import { useToast } from '../../hooks/use-toast';
import { Copy, Check } from 'lucide-react';

const InviteMembersModal = ({ isOpen, onClose, groupId }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Generate the invitation link
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/invite/${groupId}`);
      
      // Connections data - would come from Firebase in a real app
      setConnections([
        { id: '1', name: 'James Doe', relationship: 'Brother' },
        { id: '2', name: 'Mark Davis', relationship: 'Cousin', status: 'pending' },
        { id: '3', name: 'Sarah Thompson', relationship: 'Sister' }
      ]);
    }
  }, [isOpen, groupId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
    
    toast({
      title: 'Link copied',
      description: 'Invitation link copied to clipboard',
    });
  };

  const handleInvite = async (connectionId) => {
    if (!auth.currentUser) return;
    
    try {
      setIsLoading(true);
      // This would send an invitation to the connection
      await addMemberToGroup(groupId, connectionId);
      
      // Update local state
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: 'invited' } 
            : conn
        )
      );
      
      toast({
        title: 'Invitation sent',
        description: 'Your invitation has been sent successfully',
      });
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Invite family members to join your family group.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Invitation Link</label>
            <div className="flex">
              <Input 
                value={inviteLink} 
                readOnly 
                className="flex-grow p-2 text-sm border border-gray-300 rounded-l-md bg-gray-50"
              />
              <Button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md text-sm text-gray-700 hover:bg-gray-200"
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-gray-700 mb-3">Connections</h4>
          
          <div className="space-y-3">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                      <span className="text-sm font-medium leading-none text-green-700">
                        {connection.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{connection.name}</p>
                    <p className="text-xs text-gray-500">{connection.relationship}</p>
                  </div>
                </div>
                
                {connection.status === 'pending' ? (
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                    Pending
                  </span>
                ) : connection.status === 'invited' ? (
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded text-xs">
                    Invited
                  </span>
                ) : (
                  <Button 
                    onClick={() => handleInvite(connection.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    disabled={isLoading}
                    size="sm"
                  >
                    Invite
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMembersModal;