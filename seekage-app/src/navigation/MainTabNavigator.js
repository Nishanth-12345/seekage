import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useAuth } from '../utils/AuthContext';

// Seekage screens
import SeekageHomeScreen   from '../screens/Seekage/SeekageHomeScreen';
import SeekageContentScreen from '../screens/Seekage/SeekageContentScreen';
import UploadScreen        from '../screens/Seekage/UploadScreen';
import QAScreen            from '../screens/Seekage/QAScreen';
import ChatScreen          from '../screens/Seekage/ChatScreen';

// School screens
import SchoolHomeScreen    from '../screens/School/SchoolHomeScreen';
import SchoolGroupScreen   from '../screens/School/SchoolGroupScreen';
import SchoolContentScreen from '../screens/School/SchoolContentScreen';
import SchoolUploadScreen  from '../screens/School/SchoolUploadScreen';
import SchoolQAScreen      from '../screens/School/SchoolQAScreen';
import SchoolChatScreen    from '../screens/School/SchoolChatScreen';

const Tab   = createBottomTabNavigator();
const SeekStack  = createNativeStackNavigator();
const SchoolStack = createNativeStackNavigator();

const NAVY = '#1E3A5F';

function SeekageStack() {
  return (
    <SeekStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: NAVY },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <SeekStack.Screen name="SeekageHome"    component={SeekageHomeScreen}    options={{ title: 'SEEKAGE' }} />
      <SeekStack.Screen name="SeekageContent" component={SeekageContentScreen} options={{ title: 'Content' }} />
      <SeekStack.Screen name="Upload"         component={UploadScreen}         options={{ title: 'Upload' }} />
      <SeekStack.Screen name="QA"             component={QAScreen}             options={{ title: 'Q & A' }} />
      <SeekStack.Screen name="Chat"           component={ChatScreen}           options={{ title: 'Chat' }} />
    </SeekStack.Navigator>
  );
}

function SchoolStackNav() {
  return (
    <SchoolStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E5D3A' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <SchoolStack.Screen name="SchoolHome"    component={SchoolHomeScreen}    options={{ title: 'School' }} />
      <SchoolStack.Screen name="SchoolGroup"   component={SchoolGroupScreen}   options={{ title: 'Group' }} />
      <SchoolStack.Screen name="SchoolContent" component={SchoolContentScreen} options={{ title: 'Content' }} />
      <SchoolStack.Screen name="SchoolUpload"  component={SchoolUploadScreen}  options={{ title: 'Upload' }} />
      <SchoolStack.Screen name="SchoolQA"      component={SchoolQAScreen}      options={{ title: 'Q & A' }} />
      <SchoolStack.Screen name="SchoolChat"    component={SchoolChatScreen}    options={{ title: 'Chat' }} />
    </SchoolStack.Navigator>
  );
}

export default function MainTabNavigator() {
  const { user } = useAuth();
  const isSchool = user?.role === 'school' || user?.registrationType === 'school';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: NAVY,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { borderTopWidth: 0.5, borderTopColor: '#ddd', paddingBottom: 4 },
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ fontSize: 11, color }}>{route.name}</Text>
        ),
      })}
    >
      <Tab.Screen
        name="Seekage"
        component={SeekageStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📚</Text>,
        }}
      />
      <Tab.Screen
        name="School"
        component={SchoolStackNav}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏫</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
