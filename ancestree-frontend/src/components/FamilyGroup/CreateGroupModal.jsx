import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { auth, createFamilyGroup } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
});

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleSubmit = async (data) => {
    if (!auth.currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create a family group',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const groupData = {
        name: data.name,
        description: data.description || '',
        createdBy: auth.currentUser.uid,
        createdAt: new Date(),
        isPrivate: true,
      };
      
      const groupId = await createFamilyGroup(groupData);
      
      onGroupCreated({
        id: groupId,
        ...groupData,
        members: [{ id: auth.currentUser.uid, role: 'admin', joinedAt: new Date() }],
      });
      
      form.reset();
    } catch (error) {
      console.error('Error creating family group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create family group',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Family Group</DialogTitle>
          <DialogDescription>
            Create a family group to share a tree and collaborate with family members.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name (Required)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your family group"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;