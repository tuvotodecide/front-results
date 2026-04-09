import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createColumnHelper } from "@tanstack/react-table";
import Pagination from "@/components/Pagination";
import SearchForm from "@/components/SearchForm";
import Table from "@/components/Table";

vi.mock("@/store/departments/departmentsEndpoints", () => ({
  useLazyGetDepartmentsQuery: () => [vi.fn()],
}));

vi.mock("@/store/provinces/provincesEndpoints", () => ({
  useLazyGetProvincesQuery: () => [vi.fn()],
}));

type Row = {
  id: string;
  name: string;
};

const columnHelper = createColumnHelper<Row>();

describe("table, filters and pagination", () => {
  it("submits and clears the text filter payload", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchForm onSearch={onSearch} />);

    await user.type(screen.getByLabelText("Nombre"), "La Paz");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(onSearch).toHaveBeenCalledWith({ search: "La Paz" });

    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(onSearch).toHaveBeenLastCalledWith({});
  });

  it("renders tabular content with header/footer slots and row actions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <Table
        data={[{ id: "1", name: "Mesa 1" }]}
        columns={[
          columnHelper.accessor("name", {
            header: "Nombre",
            cell: (info) => info.getValue(),
          }),
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        <Table.Header>
          <div>table header</div>
        </Table.Header>
        <Table.Footer>
          <div>table footer</div>
        </Table.Footer>
      </Table>,
    );

    expect(screen.getByText("table header")).toBeInTheDocument();
    expect(screen.getByText("table footer")).toBeInTheDocument();
    expect(screen.getByText("Mesa 1")).toBeInTheDocument();

    await user.click(screen.getByTitle("Editar"));
    await user.click(screen.getByTitle("Eliminar"));

    expect(onEdit).toHaveBeenCalledWith({ id: "1", name: "Mesa 1" });
    expect(onDelete).toHaveBeenCalledWith({ id: "1", name: "Mesa 1" });
  });

  it("enforces pagination limits when moving between pages", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        totalItems={65}
        pageSize={25}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText("Mostrando 25 de 65 items")).toBeInTheDocument();
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });
});
