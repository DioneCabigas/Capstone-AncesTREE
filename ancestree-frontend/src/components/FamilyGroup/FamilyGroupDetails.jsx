import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { auth, getFamilyGroup, updateFamilyGroup, removeMemberFromGroup } from '../../lib/firebase';
import { useToast } from '../../hooks/use-toast';
import { ChevronLeft, Edit } from 'lucide-react';
import InviteMembersModal from './InviteMembersModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

const FamilyGroupDetails = ({ groupId }) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadGroupDetails = async () => {
      if (!auth.currentUser) return;
      
      try {
        setLoading(true);
        const groupData = await getFamilyGroup(groupId);
        
        if (groupData) {
          setGroup(groupData);
          // Check if current user is an admin
          const isAdmin = groupData.members.some(
            member => member.id === auth.currentUser?.uid && member.role === 'admin'
          );
          setIsAdminUser(isAdmin);
        }
      } catch (error) {
        console.error('Error loading family group details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load group details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadGroupDetails();
  }, [groupId, toast]);

  const handleTogglePrivacy = async (isPrivate) => {
    if (!group || !auth.currentUser) return;
    
    try {
      await updateFamilyGroup(group.id, { isPrivate });
      setGroup(prev => prev ? { ...prev, isPrivate } : null);
      toast({
        title: 'Success',
        description: `Group is now ${isPrivate ? 'private' : 'public'}`,
      });
    } catch (error) {
      console.error('Error updating group privacy:', error);
      toast({
        title: 'Error',
        description: 'Failed to update group privacy',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !auth.currentUser) return;
    
    try {
      await removeMemberFromGroup(group.id, auth.currentUser.uid);
      toast({
        title: 'Success',
        description: 'You have left the family group',
      });
      // Redirect to groups list
      window.location.href = '/family-groups';
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave the group',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="text-center py-12">
          <h3 className="mt-2 text-lg font-medium text-gray-900">Group not found</h3>
          <p className="mt-1 text-sm text-gray-500">The family group you're looking for doesn't exist or you don't have access.</p>
          <div className="mt-6">
            <Link href="/family-groups">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Back to Groups
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="py-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/family-groups">
            <div className="flex items-center text-sm text-gray-600 hover:text-green-600 cursor-pointer">
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Groups
            </div>
          </Link>
        </div>
        
        {/* Group Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
            </div>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Button variant="outline" className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              VIEW TREE
            </Button>
            {isAdminUser && (
              <Button 
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                EDIT GROUP
              </Button>
            )}
          </div>
        </div>
        
        {/* Group Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div>
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Group Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {group.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Family Group Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Private</h3>
                      <p className="text-xs text-gray-500">Only group members can view trees and invite new members</p>
                    </div>
                    <Switch 
                      checked={!!group.isPrivate} 
                      onCheckedChange={handleTogglePrivacy}
                      disabled={!isAdminUser}
                      className="bg-green-600"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Starting Person</h3>
                  <p className="text-xs text-gray-500 mb-2">The person who will be the starting point when new group tree</p>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                        <span className="text-sm font-medium leading-none text-green-700">JD</span>
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">John Doe</p>
                      <p className="text-xs text-gray-500">1985 - Present</p>
                    </div>
                    {isAdminUser && (
                      <Button 
                        variant="outline"
                        size="sm"
                        className="ml-auto text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded"
                      >
                        Change
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        LEAVE GROUP
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will no longer have access to this family group and its tree. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleLeaveGroup}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Leave Group
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column */}
          <div>
            <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-gray-800">
                  Family Group Members ({group.members.length})
                </CardTitle>
                <Button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  INVITE
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.members.map((member, index) => (
                    <div key={index} className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                          <span className="text-sm font-medium leading-none text-green-700">
                            {member.id === auth.currentUser?.uid ? 'ME' : 'MB'}
                          </span>
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">
                          {member.id === auth.currentUser?.uid ? 'You' : 'Member'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.role === 'admin' ? 'Admin' : 'Member'} • 
                          {member.role === 'admin' ? ' Created' : ' Joined'} 
                          {' '}{new Date(member.joinedAt.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Invite Members Modal */}
      <InviteMembersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        groupId={group.id}
      />
    </div>
  );
};

export default FamilyGroupDetails;