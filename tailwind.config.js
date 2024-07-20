/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    mode: 'jit',
    theme: {
        extend: {
            colors: {
                text: '#d3d3fe',
                background: '#01000f',
                primary: '#797cfc',
                secondary: '#23237e',
                accent: '#2a2ad6'
            },
            fontFamily: {
                roboto: ['Roboto', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif']
            }
        }
    },
    plugins: []
};
