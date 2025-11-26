'use client';

import { Box, VStack, Text, HStack, Icon } from '@chakra-ui/react';
import { motion } from 'framer-motion';
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
      p={3}
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
              borderRadius="xl"
              cursor="pointer"
              position="relative"
              color={isActive ? { base: 'blue.600', _dark: 'blue.300' } : { base: 'gray.700', _dark: 'gray.200' }}
              _hover={{ bg: !isActive ? { base: 'gray.100', _dark: 'gray.800' } : undefined }}
              onClick={() => handleNavigation(item)}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    borderRadius: 'var(--chakra-radii-lg)',
                  }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Box
                    width="100%"
                    height="100%"
                    bg={{ base: 'blue.50', _dark: 'blue.900' }}
                    borderRadius="xl"
                  />
                </motion.div>
              )}
              <Icon fontSize="20px" position="relative" zIndex={1}>
                <item.icon />
              </Icon>
              <Text fontWeight={isActive ? 'semibold' : 'medium'} position="relative" zIndex={1}>
                {item.label}
              </Text>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}
