import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';

// Define the form validation schema
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.string().optional(),
  birthplace: z.string().optional(),
  sex: z.enum(['Male', 'Female', 'Unknown']).optional(),
  status: z.enum(['Alive', 'Deceased', 'Unknown']).optional(),
  dateOfDeath: z.string().optional(),
  placeOfDeath: z.string().optional(),
});

const FamilyMemberForm = ({
  existingMember,
  isEditing,
  familyMembers,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState('input-details');
  
  // Initialize form with default values or existing member data
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      birthDate: "",
      birthplace: "",
      sex: "Unknown",
      status: "Unknown",
      dateOfDeath: "",
      placeOfDeath: "",
    }
  });

  // Update form when existingMember changes
  useEffect(() => {
    if (existingMember) {
      form.reset({
        firstName: existingMember.firstName || "",
        middleName: existingMember.middleName || "",
        lastName: existingMember.lastName || "",
        birthDate: existingMember.birthDate || "",
        birthplace: existingMember.birthplace || "",
        sex: existingMember.sex || "Unknown",
        status: existingMember.status || "Unknown",
        dateOfDeath: existingMember.dateOfDeath || "",
        placeOfDeath: existingMember.placeOfDeath || "",
      });
    } else {
      form.reset({
        firstName: "",
        middleName: "",
        lastName: "",
        birthDate: "",
        birthplace: "",
        sex: "Unknown",
        status: "Unknown",
        dateOfDeath: "",
        placeOfDeath: "",
      });
    }
  }, [existingMember, form]);

  // Render AI suggestions
  const renderSuggestions = () => {
    return (
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700">With the help of AI analysis, you might be related to:</h3>
        </div>
        
        <div className="space-y-4">
          {[
            { name: "Martha Smith", year: "1956 - Present", initials: "MS" },
            { name: "Robert Johnson", year: "1942 - 2010", initials: "RJ" },
            { name: "Elizabeth Wilson", year: "1963 - Present", initials: "EW" }
          ].map((suggestion, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary-light rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white">
                    <span className="text-sm font-medium leading-none text-gray-500">{suggestion.initials}</span>
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{suggestion.name}</p>
                  <p className="text-xs text-gray-500">{suggestion.year}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="px-2 py-1 text-xs">
                  View
                </Button>
                <Button size="sm" className="px-2 py-1 text-xs">
                  Add to Tree
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardContent className="p-4">
        <Tabs defaultValue="input-details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex border-b border-gray-200 mb-4 bg-transparent">
            <TabsTrigger
              value="input-details"
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'input-details' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'
              }`}
            >
              Input Details
            </TabsTrigger>
            <TabsTrigger
              value="connections"
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'connections' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'
              }`}
            >
              Connections
            </TabsTrigger>
            <TabsTrigger
              value="suggestions"
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'suggestions' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'
              }`}
            >
              Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input-details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">First Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Middle Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Birth Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthplace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Birthplace</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-700">Sex</FormLabel>
                      <FormControl>
                        <RadioGroup
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          className="mt-1 flex space-x-4"
                        >
                          <div className="flex items-center">
                            <RadioGroupItem id="male" value="Male" className="focus:ring-green-600 h-4 w-4 text-green-600 border-gray-300" />
                            <label htmlFor="male" className="ml-2 block text-sm text-gray-700">Male</label>
                          </div>
                          <div className="flex items-center">
                            <RadioGroupItem id="female" value="Female" className="focus:ring-green-600 h-4 w-4 text-green-600 border-gray-300" />
                            <label htmlFor="female" className="ml-2 block text-sm text-gray-700">Female</label>
                          </div>
                          <div className="flex items-center">
                            <RadioGroupItem id="sexUnknown" value="Unknown" className="focus:ring-green-600 h-4 w-4 text-green-600 border-gray-300" />
                            <label htmlFor="sexUnknown" className="ml-2 block text-sm text-gray-700">Unknown</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-gray-700">Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          className="mt-1 flex space-x-4"
                        >
                          <div className="flex items-center">
                            <RadioGroupItem id="alive" value="Alive" className="focus:ring-green-600 h-4 w-4 text-green-600 border-gray-300" />
                            <label htmlFor="alive" className="ml-2 block text-sm text-gray-700">Alive</label>
                          </div>
                          <div className="flex items-center">
                            <RadioGroupItem id="deceased" value="Deceased" className="focus:ring-green-600 h-4 w-4 text-green-600 border-gray-300" />
                            <label htmlFor="deceased" className="ml-2 block text-sm text-gray-700">Deceased</label>
                          </div>
                          <div className="flex items-center">
                            <RadioGroupItem id="statusUnknown" value="Unknown" className="focus:ring-green-600 h-4 w-4 text-green-600 border-gray-300" />
                            <label htmlFor="statusUnknown" className="ml-2 block text-sm text-gray-700">Unknown</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfDeath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Date of Death</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled={form.watch("status") !== "Deceased"}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="placeOfDeath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Place of Death</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={form.watch("status") !== "Deceased"}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                  >
                    {isEditing ? 'Update' : 'Add'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="connections">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Family Connections</h3>
              
              {familyMembers.length > 0 ? (
                <div className="space-y-4">
                  {/* This would be populated with actual connection UI */}
                  <p className="text-sm text-gray-500">
                    Select relationships between family members to establish connections in your family tree.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Add family members first to create connections between them.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="suggestions">
            {renderSuggestions()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FamilyMemberForm;