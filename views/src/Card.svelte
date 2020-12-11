<script>
    export let title = '';
    export let value = ''
    export let textStyle = 'text-success';

    $: checkURL = (url) => {
    	return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
	}

</script>

<div class="row g-2 mb-4 gutter">
    <div class="col-12">
    <p class="lead">{title}</p> 
    </div>
    <div class={`col-12 ml-2  lead ${textStyle}`}>
        {#if checkURL(value)}
            <!-- svelte-ignore a11y-img-redundant-alt -->
            <img src={value} alt="portoflio image" />
        {:else }
        <p >{value}</p>
        {/if}
       
    </div>
</div>