import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Navbar } from './components/navbar/navbar';
import { RecipeList } from './components/recipe-list/recipe-list';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthInterceptor } from './Interceptors/auth-interceptor';
import { RecipeAdd } from './components/recipe-add/recipe-add';
import { RecipeDetails } from './components/recipe-details/recipe-details';
import { Profile } from './components/profile/profile';
import { Favorites } from './pages/favorites/favorites';

@NgModule({
  declarations: [
    App,
    Login,
    Register,
    Navbar,
    RecipeList,
    RecipeAdd,
    RecipeDetails,
    Profile,
    Favorites,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App],
})
export class AppModule {}
