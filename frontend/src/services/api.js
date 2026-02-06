import axios from "axios";

/* 
Axios is like a speed dial so, for example, instead
of having to type: 
    const response = await fetch('/api/transcript');
    const data = await response.json();
    console.log(data);

You can simply use:
    const response = await api.get('/transcript');
    console.log(response.data);

*/

const api = axios.create({
  baseURL: "/api",
});

export default api;
