import { useEffect } from "react"
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
} from "lucide-react"
import {
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  dataTableFeatures,
  type DataTableFeatures,
} from "@/components/ui/data-table-features"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const DEFAULT_PAGE_SIZES = [5, 10, 20]

type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<DataTableFeatures, TData, unknown>[]
  data: TData[]
  search?: string
  pageSizeOptions?: number[]
  emptyMessage?: string
  emptyDescription?: string
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="size-3.5" />
  if (sorted === "desc") return <ArrowDown className="size-3.5" />
  return <ChevronsUpDown className="size-3.5 text-muted-foreground" />
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  search = "",
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  emptyMessage = "No se encontraron registros",
  emptyDescription,
}: DataTableProps<TData>) {
  const table = useTable(
    {
      features: dataTableFeatures,
      data,
      columns,
      globalFilterFn: "includesString",
      enableSortingRemoval: true,
      sortDescFirst: false,
      enableMultiSort: false,
      autoResetPageIndex: false,
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: pageSizeOptions.includes(5) ? 5 : pageSizeOptions[0],
        },
      },
      state: {
        globalFilter: search,
      },
    },
    (state) => ({
      pagination: state.pagination,
      globalFilter: state.globalFilter,
      sorting: state.sorting,
    }),
  )

  const pageCount = table.getPageCount()
  const filteredCount = table.getRowCount()
  const pageSize = table.state.pagination.pageSize
  const pageIndex = table.state.pagination.pageIndex
  const rows = table.getRowModel().rows

  useEffect(() => {
    table.setPageIndex(0)
  }, [search])

  useEffect(() => {
    if (pageCount > 0 && pageIndex > pageCount - 1) {
      table.setPageIndex(pageCount - 1)
    }
  }, [pageCount, pageIndex])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  const title =
                    typeof header.column.columnDef.header === "string"
                      ? header.column.columnDef.header
                      : "columna"

                  return (
                    <TableHead
                      key={header.id}
                      className="h-11 px-4"
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : "none"
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="-ml-2 h-8 px-2 text-[13px] font-semibold"
                          aria-label={
                            sorted === "asc"
                              ? `${title}: orden ascendente. Clic para ordenar descendente.`
                              : sorted === "desc"
                                ? `${title}: orden descendente. Clic para quitar el orden.`
                                : `Ordenar por ${title}`
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          <SortIcon sorted={sorted} />
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-28 px-4">
                  <div className="text-center">
                    <p className="font-medium">{emptyMessage}</p>
                    {emptyDescription ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {emptyDescription}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCount}{" "}
          {filteredCount === 1 ? "registro" : "registros"}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm font-medium">
              Mostrar
            </label>
            <Select
              value={pageSize}
              onValueChange={(value) => {
                if (value == null) return
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger
                id="page-size"
                size="sm"
                className="min-w-[4.5rem]"
                aria-label="Registros por página"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top" alignItemWithTrigger={false}>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              Página {pageCount === 0 ? 0 : pageIndex + 1} de {pageCount}
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Primera página"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
            >
              <ChevronsLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Página anterior"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Página siguiente"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Última página"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(Math.max(0, pageCount - 1))}
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
