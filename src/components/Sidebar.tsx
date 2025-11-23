'use client';

import { Box, VStack, Text, HStack, Icon } from '@chakra-ui/react';
import { LuSend, LuHistory, LuLayoutDashboard } from 'react-icons/lu';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

export default function Sidebar({ onNavigate, currentPage }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: 'home', label: '主頁', icon: LuLayoutDashboard, path: '/' },
    { id: 'history', label: '歷史紀錄', icon: LuHistory, path: '/history' },
  ];

  const handleNavigation = (item: typeof menuItems[0]) => {
    if (onNavigate) {
      onNavigate(item.id);
    } else {
      router.push(item.path);
    }
  };

  return (
    <Box
      width="240px"
      bg="bg.panel"
      borderRight="1px solid"
      borderColor={{ base: "gray.200", _dark: "gray.800" }}
      position="fixed"
      left={0}
      top="65px"
      bottom={0}
      p={4}
      zIndex={100}
      display="flex"
      flexDirection="column"
    >
      <VStack align="stretch" gap={2} flex={1}>
        {menuItems.map((item) => {
          const isActive = currentPage ? currentPage === item.id : pathname === item.path;
          return (
            <HStack
              key={item.id}
              gap={3}
              p={3}
              borderRadius="lg"
              cursor="pointer"
              bg={isActive ? { base: 'blue.50', _dark: 'blue.900/20' } : 'transparent'}
              color={isActive ? { base: 'blue.600', _dark: 'blue.300' } : { base: 'gray.700', _dark: 'gray.200' }}
              _hover={{ bg: isActive ? { base: 'blue.50', _dark: 'blue.900/20' } : { base: 'gray.100', _dark: 'gray.800' } }}
              transition="all 0.2s"
              onClick={() => handleNavigation(item)}
            >
              <Icon fontSize="20px">
                <item.icon />
              </Icon>
              <Text fontWeight={isActive ? 'semibold' : 'medium'}>
                {item.label}
              </Text>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}
