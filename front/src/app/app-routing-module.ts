import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { RecipeList } from './components/recipe-list/recipe-list';
import { RecipeAdd } from './components/recipe-add/recipe-add';
import { RecipeEdit } from './components/recipe-edit/recipe-edit';
import { RecipeDetails } from './components/recipe-details/recipe-details';
import { Profile } from './components/profile/profile';
import { Favorites } from './pages/favorites/favorites';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { AutorProfileComponent } from './components/autor-profile/autor-profile.component';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registracija', component: Register },
  { path: 'recepti', component: RecipeList },
  { path: 'recepti/:id', component: RecipeDetails },
  { path: 'dodaj-recept', component: RecipeAdd },
  { path: 'recept/:id/izmeni', component: RecipeEdit },
  { path: 'moj-profil', component: Profile },
  { path: 'favorites', component: Favorites },
  { path: 'admin', component: AdminPanelComponent },
  { path: 'autor/:id', component: AutorProfileComponent },
  { path: '', redirectTo: '/recepti', pathMatch: 'full' },
  { path: 'admin-requests', component: AdminPanelComponent },
  { path: '**', redirectTo: '/recepti' },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}