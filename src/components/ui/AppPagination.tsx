'use client';

import React from 'react';
import { Pagination as MuiPagination, Stack, Typography } from '@mui/material';

interface AppPaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onChange: (page: number) => void;
  showTotal?: boolean;
}

export default function AppPagination({ page, totalPages, total, onChange, showTotal = true }: AppPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', mt: 4 }}>
      <MuiPagination
        page={page}
        count={totalPages}
        color="primary"
        variant="outlined"
        shape="rounded"
        onChange={(_, value) => onChange(value)}
      />
      {showTotal && total !== undefined && (
        <Typography variant="body2" color="text.secondary">
          {total} items
        </Typography>
      )}
    </Stack>
  );
}
