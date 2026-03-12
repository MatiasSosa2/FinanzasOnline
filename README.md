# Financiero - Proyecto de Gestión

Este proyecto es una aplicación web de gestión financiera construida con [Next.js](https://nextjs.org), Prisma y bases de datos relacionales (SQLite por defecto para desarrollo).

## Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- [Git](https://git-scm.com/)

## Instrucciones de Instalación

Sigue estos pasos para configurar y ejecutar el proyecto localmente:

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd financiero
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    # o
    yarn install
    ```

3.  **Configurar variables de entorno:**
    Copia el archivo de ejemplo `.env.example` a `.env`:
    ```bash
    cp .env.example .env
    # En Windows (PowerShell):
    Copy-Item .env.example .env
    ```
    Edita el archivo `.env` con tus propios valores secretos (si aplica). Para desarrollo local, los valores por defecto suelen funcionar bien.

4.  **Configurar la base de datos:**
    Inicializa la base de datos (creará el archivo `dev.db`):
    ```bash
    npx prisma migrate dev --name init
    # Si quieres poblar la base de datos con datos de prueba:
    npx prisma db seed
    ```

5.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

6.  **Abrir en el navegador:**
    Visita [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## Estructura del Proyecto

- `src/app`: Rutas y páginas de la aplicación (App Router).
- `src/components`: Componentes reutilizables de React.
- `src/lib`: Utilidades, configuración de Prisma y autenticación.
- `prisma`: Esquema de la base de datos y migraciones.
- `public`: Archivos estáticos.

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Construye la aplicación para producción.
- `npm start`: Inicia el servidor de producción.
- `npm run lint`: Ejecuta el linter para encontrar problemas en el código.

## Licencia

[MIT](https://choosealicense.com/licenses/mit/)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
