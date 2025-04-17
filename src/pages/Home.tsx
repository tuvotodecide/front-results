import React from "react";
import { Link } from "react-router-dom";
import Table from "../components/Table";
import type { ColumnDef } from "@tanstack/react-table";

const data = [
  { id: 1, name: "Juan", age: 28, email: "juan@email.com" },
  { id: 2, name: "Ana", age: 34, email: "ana@email.com" },
  { id: 3, name: "Luis", age: 22, email: "luis@email.com" },
];

const columns: ColumnDef<(typeof data)[0]>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "age", header: "Edad" },
  { accessorKey: "email", header: "Email" },
];

const Home: React.FC = () => {
  return (
    <div>
      <Link to="/resultados">Resultados</Link> |{" "}
      <Link to="/enviarActa">Enviar acta</Link>
      <h1>Home</h1>
      <div className="my-8">
        <Table data={data} columns={columns} />
      </div>
      <div>
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Amet, mollitia
        placeat quod dolore, illum nihil aliquid rerum sit quos est tenetur
        labore commodi eveniet laudantium quisquam pariatur, consequuntur
        assumenda eaque? Lorem ipsum dolor sit amet consectetur adipisicing
        elit. Voluptates, omnis, quia sequi ad id distinctio corporis quod, sint
        hic porro possimus tenetur? Cupiditate voluptatum ullam nemo enim
        reiciendis quia hic? Lorem ipsum dolor, sit amet consectetur adipisicing
        elit. Velit assumenda harum explicabo ab exercitationem, facilis
        corporis similique praesentium beatae minus vel blanditiis natus sint
        quam. Sed deserunt cupiditate optio distinctio. Lorem ipsum dolor sit,
        amet consectetur adipisicing elit. Similique, error, officiis at officia
        porro quis dicta qui dolor praesentium sapiente, hic amet? Reprehenderit
        incidunt tempore reiciendis neque, sapiente commodi optio. Lorem ipsum
        dolor sit amet consectetur, adipisicing elit. Quo magni laudantium
        facere nam placeat, tempora natus veniam voluptatibus corrupti. Dolores
        reiciendis vero facilis expedita eos, nihil sequi exercitationem sint
        eum? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Amet,
        mollitia placeat quod dolore, illum nihil aliquid rerum sit quos est
        tenetur labore commodi eveniet laudantium quisquam pariatur,
        consequuntur assumenda eaque? Lorem ipsum dolor sit amet consectetur
        adipisicing elit. Voluptates, omnis, quia sequi ad id distinctio
        corporis quod, sint hic porro possimus tenetur? Cupiditate voluptatum
        ullam nemo enim reiciendis quia hic? Lorem ipsum dolor, sit amet
        consectetur adipisicing elit. Velit assumenda harum explicabo ab
        exercitationem, facilis corporis similique praesentium beatae minus vel
        blanditiis natus sint quam. Sed deserunt cupiditate optio distinctio.
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Similique,
        error, officiis at officia porro quis dicta qui dolor praesentium
        sapiente, hic amet? Reprehenderit incidunt tempore reiciendis neque,
        sapiente commodi optio. Lorem ipsum dolor sit amet consectetur,
        adipisicing elit. Quo magni laudantium facere nam placeat, tempora natus
        veniam voluptatibus corrupti. Dolores reiciendis vero facilis expedita
        eos, nihil sequi exercitationem sint eum? Lorem ipsum dolor sit amet
        consectetur, adipisicing elit. Amet, mollitia placeat quod dolore, illum
        nihil aliquid rerum sit quos est tenetur labore commodi eveniet
        laudantium quisquam pariatur, consequuntur assumenda eaque? Lorem ipsum
        dolor sit amet consectetur adipisicing elit. Voluptates, omnis, quia
        sequi ad id distinctio corporis quod, sint hic porro possimus tenetur?
        Cupiditate voluptatum ullam nemo enim reiciendis quia hic? Lorem ipsum
        dolor, sit amet consectetur adipisicing elit. Velit assumenda harum
        explicabo ab exercitationem, facilis corporis similique praesentium
        beatae minus vel blanditiis natus sint quam. Sed deserunt cupiditate
        optio distinctio. Lorem ipsum dolor sit, amet consectetur adipisicing
        elit. Similique, error, officiis at officia porro quis dicta qui dolor
        praesentium sapiente, hic amet? Reprehenderit incidunt tempore
        reiciendis neque, sapiente commodi optio. Lorem ipsum dolor sit amet
        consectetur, adipisicing elit. Quo magni laudantium facere nam placeat,
        tempora natus veniam voluptatibus corrupti. Dolores reiciendis vero
        facilis expedita eos, nihil sequi exercitationem sint eum? Lorem ipsum
        dolor sit amet consectetur, adipisicing elit. Amet, mollitia placeat
        quod dolore, illum nihil aliquid rerum sit quos est tenetur labore
        commodi eveniet laudantium quisquam pariatur, consequuntur assumenda
        eaque? Lorem ipsum dolor sit amet consectetur adipisicing elit.
        Voluptates, omnis, quia sequi ad id distinctio corporis quod, sint hic
        porro possimus tenetur? Cupiditate voluptatum ullam nemo enim reiciendis
        quia hic? Lorem ipsum dolor, sit amet consectetur adipisicing elit.
        Velit assumenda harum explicabo ab exercitationem, facilis corporis
        similique praesentium beatae minus vel blanditiis natus sint quam. Sed
        deserunt cupiditate optio distinctio. Lorem ipsum dolor sit, amet
        consectetur adipisicing elit. Similique, error, officiis at officia
        porro quis dicta qui dolor praesentium sapiente, hic amet? Reprehenderit
        incidunt tempore reiciendis neque, sapiente commodi optio. Lorem ipsum
        dolor sit amet consectetur, adipisicing elit. Quo magni laudantium
        facere nam placeat, tempora natus veniam voluptatibus corrupti. Dolores
        reiciendis vero facilis expedita eos, nihil sequi exercitationem sint
        eum? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Amet,
        mollitia placeat quod dolore, illum nihil aliquid rerum sit quos est
        tenetur labore commodi eveniet laudantium quisquam pariatur,
        consequuntur assumenda eaque? Lorem ipsum dolor sit amet consectetur
        adipisicing elit. Voluptates, omnis, quia sequi ad id distinctio
        corporis quod, sint hic porro possimus tenetur? Cupiditate voluptatum
        ullam nemo enim reiciendis quia hic? Lorem ipsum dolor, sit amet
        consectetur adipisicing elit. Velit assumenda harum explicabo ab
        exercitationem, facilis corporis similique praesentium beatae minus vel
        blanditiis natus sint quam. Sed deserunt cupiditate optio distinctio.
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Similique,
        error, officiis at officia porro quis dicta qui dolor praesentium
        sapiente, hic amet? Reprehenderit incidunt tempore reiciendis neque,
        sapiente commodi optio. Lorem ipsum dolor sit amet consectetur,
        adipisicing elit. Quo magni laudantium facere nam placeat, tempora natus
        veniam voluptatibus corrupti. Dolores reiciendis vero facilis expedita
        eos, nihil sequi exercitationem sint eum?
      </div>
    </div>
  );
};

export default Home;
