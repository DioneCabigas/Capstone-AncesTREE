import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';
import FamilyTreeViewer from './FamilyTreeViewer';
import FamilyMemberForm from './FamilyMemberForm';
import { Button } from '../ui/button';
import { auth, createFamilyMember, getFamilyMembers, updateFamilyMember, deleteFamilyMember } from '../../lib/firebase';
import { Plus, ZoomIn, ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';

const FamilyTreeBuilder = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (auth.currentUser) {
        try {
          setLoading(true);
          const members = await getFamilyMembers(auth.currentUser.uid);
          setFamilyMembers(members);
        } catch (error) {
          console.error('Error loading family members:', error);
          toast({
            title: 'Error',
            description: 'Failed to load family members',
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadFamilyMembers();
  }, [toast]);

  const handleAddPerson = () => {
    setSelectedMember(null);
    setIsEditing(false);
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setIsEditing(true);
  };

  const handleSubmit = async (memberData) => {
    if (!auth.currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add or update family members',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isEditing && selectedMember) {
        // Update existing member
        await updateFamilyMember(auth.currentUser.uid, selectedMember.id, memberData);
        setFamilyMembers(prev => 
          prev.map(member => 
            member.id === selectedMember.id ? { ...member, ...memberData } : member
          )
        );
        toast({
          title: 'Success',
          description: 'Family member updated successfully',
        });
      } else {
        // Add new member
        const newMemberId = await createFamilyMember(auth.currentUser.uid, memberData);
        const newMember = { id: newMemberId, ...memberData };
        setFamilyMembers(prev => [...prev, newMember]);
        toast({
          title: 'Success',
          description: 'Family member added successfully',
        });
      }
      
      // Reset form
      setSelectedMember(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving family member:', error);
      toast({
        title: 'Error',
        description: 'Failed to save family member',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!auth.currentUser) return;
    
    try {
      await deleteFamilyMember(auth.currentUser.uid, memberId);
      setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
      
      if (selectedMember?.id === memberId) {
        setSelectedMember(null);
        setIsEditing(false);
      }
      
      toast({
        title: 'Success',
        description: 'Family member deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting family member:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete family member',
        variant: 'destructive'
      });
    }
  };

  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-white">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link href="/">
              <div className="flex items-center text-sm text-gray-600 hover:text-green-600 cursor-pointer">
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back
              </div>
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row">
            {/* Family Tree Canvas Area */}
            <div className="w-full md:w-2/3 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-700">Family Tree</h2>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleAddPerson}
                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Person
                  </Button>
                  <Button 
                    variant="outline" 
                    className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                  >
                    <ZoomIn className="h-4 w-4 mr-1" /> Zoom
                  </Button>
                </div>
              </div>
              
              {/* Family Tree Visualization */}
              <div className="relative h-[500px] w-full border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                {loading ? (
                  <p>Loading family tree...</p>
                ) : familyMembers.length > 0 ? (
                  <FamilyTreeViewer 
                    familyMembers={familyMembers} 
                    onSelectMember={handleSelectMember} 
                    onDeleteMember={handleDeleteMember}
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">No family members added yet</p>
                    <Button 
                      onClick={handleAddPerson}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Your First Family Member
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Person Information Panel */}
            <div className="w-full md:w-1/3 p-4 bg-gray-50 border-l border-gray-200">
              <FamilyMemberForm 
                existingMember={selectedMember} 
                isEditing={isEditing}
                familyMembers={familyMembers}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default FamilyTreeBuilder;