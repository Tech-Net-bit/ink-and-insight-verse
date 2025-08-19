import React from 'react';
import { Button } from '@/components/ui/button';
import { Table } from 'lucide-react';

interface TableButtonProps {
  onClick: () => void;
}

const TableButton = ({ onClick }: TableButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="ql-table-insert"
      title="Insert Table"
    >
      <Table className="h-4 w-4" />
    </Button>
  );
};

export default TableButton;