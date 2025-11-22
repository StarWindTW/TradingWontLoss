'use client';

import { Box, Flex } from '@chakra-ui/react';
import { useState, useEffect, useRef, ReactNode } from 'react';

interface ResizableSplitProps {
  left: ReactNode;
  right: ReactNode;
}

export default function ResizableSplit({ left, right }: ResizableSplitProps) {
  const [leftWidth, setLeftWidth] = useState(80); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Limit width between 20% and 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <Flex 
      ref={containerRef} 
      direction={{ base: 'column', xl: 'row' }} 
      width="100%"
      height={{ base: 'auto', xl: '100%' }}
      gap={{ base: 8, xl: 0 }}
    >
      {/* Left Pane */}
      <Box 
        width={{ base: '100%', xl: `${leftWidth}%` }} 
        height={{ base: 'auto', xl: '100%' }}
        minW="0"
        pr={{ base: 0, xl: 4 }}
      >
        {left}
      </Box>

      {/* Resizer Handle - Only visible on XL screens */}
      <Box
        display={{ base: 'none', xl: 'block' }}
        width="12px"
        height="100%"
        cursor="col-resize"
        onMouseDown={handleMouseDown}
        mx="-6px"
        zIndex={10}
        position="relative"
        _hover={{
          "& > div": {
            width: "4px",
            bg: "blue.400"
          }
        }}
      >
        <Box
          width={isDragging ? "4px" : "2px"}
          height="100%"
          bg={isDragging ? "blue.500" : { base: "gray.200", _dark: "border.emphasized" }}
          margin="0 auto"
          borderRadius="full"
          transition="all 0.2s"
        />
      </Box>

      {/* Right Pane */}
      <Box 
        width={{ base: '100%', xl: `${100 - leftWidth}%` }} 
        height={{ base: 'auto', xl: '100%' }}
        minW="0"
        pl={{ base: 0, xl: 4 }}
        overflowY={{ base: 'visible', xl: 'auto' }}
      >
        {right}
      </Box>
    </Flex>
  );
}
