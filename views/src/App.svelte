<script>
	import { onMount } from 'svelte';
	import Card from './Card.svelte';

	// const spreadsheetID = '10QkdUFqrvq723gNwvcz9WKeajz0tllF5-0BMHAOEPa8';
	const spreadsheetID = '19e8Ku8HkchntzoCF6S2h9DrM3mibvcDMMdAjxcWDsgk';
    const sheetNumber = 1;

    const url = `https://spreadsheets.google.com/feeds/list/${spreadsheetID}/${sheetNumber}/public/values?alt=json`;
	let currentUser = {
		gsx$whatisyourname: ''
	};

	async function hashchange() {
		const query = new URLSearchParams(window.location.search);
		const data = await fetch(url).then(r => r.json());
		const entries = data && data.feed && data.feed.entry || [];
		const userName = query.get('name');
		currentUser = {...currentUser , ...(!userName  ? entries[entries.length-1] : entries.find(i=> i.gsx$whatisyourname && i.gsx$whatisyourname.$t  === userName )) };
		window.scrollTo(0,0);  
	}

	$: row = (prop)=> {
		const value = currentUser['gsx$'+prop] ;
		return value && value.$t || '';
	}



	onMount(hashchange);
</script>

<main id="page-top">
	<!-- Navigation-->
	<nav class="navbar navbar-expand-lg bg-secondary text-uppercase fixed-top" id="mainNav">
		<div class="container">
			<a class="navbar-brand js-scroll-trigger" href="#page-top">User Manual</a>
			<button class="navbar-toggler navbar-toggler-right text-uppercase font-weight-bold bg-primary text-white rounded" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
				Menu
				<i class="fas fa-bars"></i>
			</button>
			<div class="collapse navbar-collapse" id="navbarResponsive">
				<ul class="navbar-nav ml-auto">
					<li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger" href="#work-style">Working Style</a></li>
					<li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger" href="#personal-background">Personal Background</a></li>
					<li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger" href="#trivia">Trivia</a></li>
				</ul>
			</div>
		</div>
	</nav>
	<!-- Masthead-->
	<header class="masthead bg-primary text-white text-center">
		<div class="container d-flex align-items-center flex-column">
			<!-- Masthead Avatar Image-->
			<img class="masthead-avatar mb-5" src="assets/img/avataaars.svg" alt="" />
			<!-- Masthead Heading-->
			<h1 class="masthead-heading text-uppercase mb-0">{row('whatisyourname')}</h1>
			<!-- Icon Divider-->
			<div class="divider-custom divider-light">
				<div class="divider-custom-line"></div>
				<div class="divider-custom-icon"><i class="fas fa-star"></i></div>
				<div class="divider-custom-line"></div>
			</div>
			<!-- Masthead Subheading-->
			<p class="masthead-subheading font-weight-light mb-0">Welcome to my personal user manual</p>
		</div>
	</header>
	<!-- Portfolio Section-->
	<section class="page-section portfolio" id="work-style">
		<div class="container">
			<!-- Portfolio Section Heading-->
			<h2 class="page-section-heading text-center text-uppercase text-secondary mb-0">work-style</h2>
			<!-- Icon Divider-->
			<div class="divider-custom">
				<div class="divider-custom-line"></div>
				<div class="divider-custom-icon"><i class="fas fa-star"></i></div>
				<div class="divider-custom-line"></div>
			</div>

			<Card title="What is your favourite communication method?" value={row('whatisyourfavouritecommunicationmethod')} />
			 
			<Card title="How do you like to receive feedback?" value={row('howdoyouliketoreceivefeedback')} />

			<Card title="When do you do your best work?" value={row('whendoyoudoyourbestwork')} />

			<Card title="How do you learn best?" value={row('howdoyoulearnbest')} />

			<Card title="What are your strengths?" value={row('whatareyourstrengths')} />

			<Card title="What are your weaknesses?" value={row('whatareyourweaknesses')} />

			<Card title="Which technology stack are you strongest with?" value={row('whichtechnologystackareyoustrongestwith')} />

			<Card title="What do you struggle with?" value={row('whatdoyoustrugglewith')} />

			<Card title="What do you find frustrating in a work environment?" value={row('whatdoyoufindfrustratinginaworkenvironment')} />

			<Card title="What computer OS do you like?" value={row('whatcomputerosdoyoulike')} />

			<Card title="What is your favourite code editing tool?" value={row('whatisyourfavouritecodeeditingtool')} />

			<Card title="If you would like, share some links to your social media accounts (personal blog, etc)" value={row('ifyouwouldlikesharesomelinkstoyoursocialmediaaccountspersonalblogetc')} />

			<Card title="Would you say you are more introverted or extroverted?" value={row('wouldyousayyouaremoreintrovertedorextroverted')} />

			<Card title="What do you enjoy doing after work? " value={row('doyouhaveanypetswhatkind')} />


		</div>
	</section>
	<!-- About Section-->
	<section class="page-section bg-primary text-white mb-0" id="personal-background">
		<div class="container">
			<!-- About Section Heading-->
			<h2 class="page-section-heading text-center text-uppercase text-white">Personal Background</h2>
			<!-- Icon Divider-->
			<div class="divider-custom divider-light">
				<div class="divider-custom-line"></div>
				<div class="divider-custom-icon"><i class="fas fa-star"></i></div>
				<div class="divider-custom-line"></div>
			</div>
			
			<Card title="What do you prefer to be called?" value={row('whatdoyouprefertobecalled')} textStyle="text-warning" />

			<Card title="Do you prefer iphone or android?" value={row('doyoupreferiphoneorandroid')} textStyle="text-warning" />



		</div>
	</section>
	<!-- Contact Section-->
	<section class="page-section" id="trivia">
		<div class="container">
			<!-- Contact Section Heading-->
			<h2 class="page-section-heading text-center text-uppercase text-secondary mb-0">Trivia</h2>
			<!-- Icon Divider-->
			<div class="divider-custom">
				<div class="divider-custom-line"></div>
				<div class="divider-custom-icon"><i class="fas fa-star"></i></div>
				<div class="divider-custom-line"></div>
			</div>
			<!-- Contact Section Form-->
 
				<Card title="What is an interesting personal fact you could share?" value={row('whatisaninterestingpersonalfactyoucouldshare')} />


				<Card title="Do you have any pets? What kind? " value={row('whatdoyouenjoydoingafterwork')} />

				<Card title="What is your favourite book?" value={row('whatisyourfavouritebook')} />

				<Card title="What is your favourite movie?" value={row('whatisyourfavouritemovie')} />

				<Card title="What is your favourite TV show?" value={row('whatisyourfavouritetvshow')} />

				<Card title="What do you love to eat?" value={row('whatdoyoulovetoeat')} />

				<Card title="What is your dream tourist destination?" value={row('whatisyourdreamtouristdestination')} />

				<Card title="What is your spirit animal?" value={row('whatisyourspiritanimal')} />

				<Card title="What is your favourite GIF? (provide a URL)" value={row('whatisyourfavouritegifprovideaurl')} />

				<Card title="What is your favourite emoji? (provide a URL)" value={row('whatisyourfavouriteemojiprovideaurl')} />





			</div>
	 
	</section>
	<!-- Footer-->
	<footer class="footer text-center">
		<div class="container">
			<div class="row">
				<!-- Footer Location-->
				<div class="col-lg-6 mb-5 mb-lg-0">
					<h4 class="text-uppercase mb-4">Location</h4>
					<p class="lead mb-0">
						18/1 Margaret St
						<br />
						Sydney NSW 2000
					</p>
				</div>
				<!-- Footer Social Icons-->
				<div class="col-lg-6 mb-5 mb-lg-0">
					<h4 class="text-uppercase mb-4">Around the Web</h4>
					<a class="btn btn-outline-light btn-social mx-1" href="#!"><i class="fab fa-fw fa-facebook-f"></i></a>
					<a class="btn btn-outline-light btn-social mx-1" href="#!"><i class="fab fa-fw fa-twitter"></i></a>
					<a class="btn btn-outline-light btn-social mx-1" href="#!"><i class="fab fa-fw fa-linkedin-in"></i></a>
					<a class="btn btn-outline-light btn-social mx-1" href="#!"><i class="fab fa-fw fa-dribbble"></i></a>
				</div>

			</div>
		</div>
	</footer>
	<!-- Copyright Section-->
	<div class="copyright py-4 text-center text-white">
		<div class="container"><small>Copyright © Personal User Manual 2020</small></div>
	</div>
	<!-- Scroll to Top Button (Only visible on small and extra-small screen sizes)-->
	<div class="scroll-to-top d-lg-none position-fixed">
		<a class="js-scroll-trigger d-block text-center text-white rounded" href="#page-top"><i class="fa fa-chevron-up"></i></a>
	</div>
</main>
 


