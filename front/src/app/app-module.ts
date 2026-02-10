// frontend/src/app/app-module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Navbar } from './components/navbar/navbar';
import { RecipeList } from './components/recipe-list/recipe-list';
import { RecipeAdd } from './components/recipe-add/recipe-add';
import { RecipeDetails } from './components/recipe-details/recipe-details'; // OVO JE STANDALONE?
import { Profile } from './components/profile/profile';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { AuthInterceptor } from './interceptors/auth-interceptor';

@NgModule({
  declarations: [
    App,
    Login,
    Register,
    Navbar,
    RecipeList,
    RecipeAdd,
    Profile,
    AdminPanelComponent
    // NE DODAVAJTE RecipeDetails OVDE AKO JE STANDALONE!
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    CommonModule,
<<<<<<< Updated upstream
    RecipeDetails, // standalone
    AdminPanelComponent // DODAJTE OVDE - standalone
=======
    RecipeDetails  // AKO JE STANDALONE, ONDA OVDE U IMPORTS
>>>>>>> Stashed changes
  ],
  providers: [
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: AuthInterceptor, 
      multi: true 
    }
  ],
  bootstrap: [App]
})
export class AppModule { }