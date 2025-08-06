import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useLocation } from 'react-router-dom';
// import { useLoginUserMutation } from '../../store/auth/authEndpoints';
import { setAuth } from '../../store/auth/authSlice';
import LoadingButton from '../../components/LoadingButton';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const [loginUser] = useLoginUserMutation();
  const location = useLocation();
  const initialValues = { email: '', password: '' };

  const validationSchema = Yup.object({
    // email: Yup.string().email('Invalid email address').required('Required'),
    email: Yup.string().required('Required'),
    password: Yup.string()
      .min(6, 'Must be at least 6 characters')
      .required('Required'),
  });

  const onSubmit = (values: typeof initialValues) => {
    console.log('Form data', values);
    // loginUser(values)
    //   .unwrap()
    //   .then((response) => {
    //     dispatch(setAuth(response));
    //     navigate('/panel');
    //     console.log('Login successful', response);
    //   })
    //   .catch((error) => {
    //     console.log('Error', error);
    //   });
    if (values.email === 'admin' && values.password === 'admin321') {
      dispatch(
        setAuth({
          access_token: 'fake_token',
          user: { id: 1, role: 'admin', name: 'admin', ...values },
        })
      );
      navigate('/panel');
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}');
    const token = localStorage.getItem('token');
    console.log('protected route useeffect', user, token);
    if (user && token) {
      console.log('user and token found in local storage');
      dispatch(setAuth({ access_token: token, user: user }));
      if (location.state?.from === 'ProtectedComponent') {
        console.log('redirecting to protected component');
        navigate(-1);
        return;
      }
      console.log('redirecting to panel');
      navigate('/panel');
    }
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-700">
          Yo Custodio
        </h1>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          <Form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <Field
                // type="email"
                id="email"
                name="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-sm text-red-500 mt-1"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Field
                type="password"
                id="password"
                name="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <ErrorMessage
                name="password"
                component="div"
                className="text-sm text-red-500 mt-1"
              />
            </div>
            <div className="mt-6">
              <LoadingButton type="submit" className="w-full">
                Login
              </LoadingButton>
              {/* <div className="text-center text-sm mt-4">
                <a href="#" className="text-blue-600 hover:underline">
                  Olvidaste tu password?
                </a>
                <p className="text-gray-600">¿No tienes una cuenta?</p>
                <Link
                  className="text-blue-600 hover:underline"
                  to="/crearCuenta"
                >
                  Crear cuenta
                </Link>
              </div> */}
            </div>
          </Form>
        </Formik>
      </div>
    </div>
  );
};

export default Login;
