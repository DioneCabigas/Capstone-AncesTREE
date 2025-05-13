import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { auth, getUserFamilyGroups } from '../../lib/firebase';
import { useToast } from '../../hooks/use-toast';
import CreateGroupModal from './CreateGroupModal';
import { FaUsers, FaPlus } from 'react-icons/fa';

const FamilyGroupsList = () => {
  const [familyGroups, setFamilyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadGroups = async () => {
      if (auth.currentUser) {
        try {
          setLoading(true);
          const groups = await getUserFamilyGroups(auth.currentUser.uid);
          setFamilyGroups(groups);
        } catch (error) {
          console.error('Error loading family groups:', error);
          toast({
            title: 'Error',
            description: 'Failed to load family groups',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadGroups();
  }, [toast]);

  const handleCreateGroup = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleGroupCreated = (newGroup) => {
    setFamilyGroups(prev => [...prev, newGroup]);
    setIsModalOpen(false);
    toast({
      title: 'Success',
      description: 'Family group created successfully',
    });
  };

  const getMemberRole = (group) => {
    if (!auth.currentUser) return '';
    
    const member = group.members.find(m => m.id === auth.currentUser?.uid);
    return member ? member.role : '';
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Family Groups</h1>
          <p className="text-gray-600">Create a family group to share a tree and send messages to family members.</p>
        </div>

        <Button
          onClick={handleCreateGroup}
          className="mb-6 bg-primary hover:bg-primary-dark text-white"
        >
          Create Group
        </Button>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-gray-100 animate-pulse">
                <CardContent className="p-6 h-32"></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyGroups.map(group => (
              <Link key={group.id} href={`/family-groups/${group.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>
                      {getMemberRole(group) === 'admin' ? 'Admin' : 'Member'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <div className="text-sm text-gray-500">
                        Members: {group.members.length}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border border-gray-300 text-gray-700"
                      >
                        View Tree
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* If there's no groups, show this */}
            {familyGroups.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No family groups</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new family group.</p>
                <div className="mt-6">
                  <Button
                    onClick={handleCreateGroup}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    <FaPlus className="mr-2 h-4 w-4" />
                    Create Family Group
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
};

export default FamilyGroupsList;