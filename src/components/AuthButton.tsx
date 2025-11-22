import { Button, Flex, Text, HStack, Avatar, Image, IconButton, MenuRoot, MenuTrigger, MenuContent, MenuItem, MenuSeparator, Box } from '@chakra-ui/react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FaDiscord } from 'react-icons/fa';
import { LuLogOut, LuMoon, LuSun, LuMonitor } from 'react-icons/lu';
import { useColorMode } from '@/components/ui/color-mode';
import { motion } from 'framer-motion';
import TestAnimation from './TestAnimation';

const MotionBox = motion(Box);

export default function AuthButton() {
  const { data: session, status } = useSession();
  const { colorMode, setColorMode } = useColorMode();

  if (status === 'loading') {
    return <Button loading>Loading...</Button>;
  }

  // if (session) {
  //   return (
  //     <Box position="relative">
  //       <MenuRoot positioning={{ placement: "bottom-end" }}>
  //         <MenuTrigger asChild>
  //           <Button variant="ghost" h="auto" p={2} rounded="lg">
  //             <HStack gap={3}>
  //               <Avatar.Root size="md">
  //                 <Avatar.Image 
  //                   src={session.user?.image || undefined}
  //                   alt={session.user?.name || undefined}
  //                 />
  //                 <Avatar.Fallback>{session.user?.name?.charAt(0).toUpperCase()}</Avatar.Fallback>
  //               </Avatar.Root>
  //               <Text fontWeight="medium">{session.user?.name}</Text>
  //             </HStack>
  //           </Button>
  //         </MenuTrigger>
  //         <MenuContent bg="transparent" shadow="none" border="none" p={0} minW="240px">
  //           <MotionBox
  //             initial={{ 
  //               opacity: 0,
  //               width: "40px",
  //               height: "40px",
  //               borderRadius: "50%"
  //             }}
  //             animate={{ 
  //               opacity: 1,
  //               width: "100%",
  //               height: "auto",
  //               borderRadius: "16px"
  //             }}
  //             exit={{ 
  //               opacity: 0,
  //               width: "40px",
  //               height: "40px",
  //               borderRadius: "50%"
  //             }}
  //             transition={{ duration: 0.3, ease: "easeInOut" }}
  //             transformOrigin="top right"
  //             bg="bg.muted"
  //             border="1px solid"
  //             borderColor="border.emphasized"
  //             shadow="lg"
  //             overflow="hidden"
  //           >
  //             <MenuItem value="light" onClick={() => setColorMode('light')}>
  //               <LuSun /> 亮色模式 {colorMode === 'light' && '✓'}
  //             </MenuItem>
  //             <MenuItem value="dark" onClick={() => setColorMode('dark')}>
  //               <LuMoon /> 深色模式 {colorMode === 'dark' && '✓'}
  //             </MenuItem>
  //             <MenuItem value="system" onClick={() => setColorMode('system')}>
  //               <LuMonitor /> 跟隨系統 {colorMode === 'system' && '✓'}
  //             </MenuItem>
  //             <MenuSeparator />
  //             <MenuItem value="logout" color="fg.error" onClick={() => signOut()}>
  //               <LuLogOut /> 登出
  //             </MenuItem>
  //           </MotionBox>
  //         </MenuContent>
  //       </MenuRoot>
  //     </Box>
  //   );
  // }

  if (session) return <TestAnimation />;

  return (
    <Button
      onClick={() => signIn('discord')}
      colorPalette="purple"
    >
      <FaDiscord />
      使用 Discord 登入
    </Button>
  );
}