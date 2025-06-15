
import { useState, useEffect } from 'react';
import { AIRole, Language } from '@/types/chat';
import { RoleConfig } from '@/config/roleConfig';

interface CustomRoleData extends RoleConfig {
  id: string;
}

interface CustomRolesStorage {
  [key: string]: CustomRoleData;
}

export const useRoleManagement = () => {
  const [customRoles, setCustomRoles] = useState<CustomRolesStorage>({});

  useEffect(() => {
    const savedRoles = localStorage.getItem('custom-roles');
    if (savedRoles) {
      try {
        const parsed = JSON.parse(savedRoles);
        setCustomRoles(parsed);
      } catch (error) {
        console.error('Error loading custom roles:', error);
      }
    }
  }, []);

  const saveToStorage = (roles: CustomRolesStorage) => {
    localStorage.setItem('custom-roles', JSON.stringify(roles));
    setCustomRoles(roles);
  };

  const addCustomRole = (roleData: Omit<CustomRoleData, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const newRole = { ...roleData, id };
    const updatedRoles = { ...customRoles, [id]: newRole };
    saveToStorage(updatedRoles);
  };

  const updateRole = (roleId: string, updates: Partial<RoleConfig>) => {
    if (customRoles[roleId]) {
      const updatedRoles = {
        ...customRoles,
        [roleId]: { ...customRoles[roleId], ...updates }
      };
      saveToStorage(updatedRoles);
    }
  };

  const deleteRole = (roleId: AIRole) => {
    if (customRoles[roleId]) {
      const updatedRoles = { ...customRoles };
      delete updatedRoles[roleId];
      saveToStorage(updatedRoles);
    }
  };

  const updateRoleExamples = (roleId: string, examples: string[]) => {
    updateRole(roleId, { examples });
  };

  return {
    customRoles,
    addCustomRole,
    updateRole,
    deleteRole,
    updateRoleExamples
  };
};
